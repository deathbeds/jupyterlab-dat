import { dat } from '@deathbeds/dat-sdk-webpack';
import { each } from '@phosphor/algorithm';
import { ElementExt } from '@phosphor/domutils';

import { VDomModel } from '@jupyterlab/apputils';
import { IIconRegistry } from '@jupyterlab/ui-components';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import {
  ICellModel,
  MarkdownCellModel,
  CodeCellModel,
  RawCellModel,
  ICodeCellModel,
  isCodeCellModel,
  isMarkdownCellModel
} from '@jupyterlab/cells';
import {
  NotebookPanel,
  INotebookModel,
  NotebookActions
} from '@jupyterlab/notebook';

import { nbformat } from '@jupyterlab/coreutils';

import { IDatManager } from '@deathbeds/jupyterlab-dat/lib/tokens';
import { ExplodeJSONStrategist } from '@deathbeds/jupyterlab-dat/lib/strategies/explode';
import { DAT_NOTEBOOK } from '.';

const DEFAULT_NOTEBOOK = '/Untitled.ipynb';
const CELL_IDS_PATH = ['cells'];
const INFO_INTERVAL = 10000;
const NOOP_PATH = /\/(dat.json|Untitled\.ipynb|cell|cell\/[^\/]+)$/;
const METADATA_KEY = 'jupyterlab-dat';
const VALID_DAT = /(dat:\/\/)?[\da-f]{64}/;

export class DatNotebookModel extends VDomModel {
  private _panel: NotebookPanel;
  private _context: DocumentRegistry.IContext<INotebookModel>;
  private _manager: IDatManager;
  private _strategist = new ExplodeJSONStrategist();
  private _status: string = 'zzz';
  private _icons: IIconRegistry;
  // publisher stuff
  private _publishDat: dat.IDatArchive;
  private _publishUrl: string;
  private _publishInfo: dat.IDatArchive.IArchiveInfo;
  private _title: string;
  private _author: string;
  private _description: string;
  // subscriber stuff
  private _subscribeUrl: string;
  private _subscribeDat: dat.IDatArchive;
  private _subscribeInfo: dat.IDatArchive.IArchiveInfo;
  private _outputModelPublishers = new Map<ICellModel, Function>();
  private _metadataModelPublishers = new Map<ICellModel, Function>();
  private _sourceModelPublishers = new Map<ICellModel, Function>();
  private _follow = true;
  private _autoRender = true;
  private _autoTrust = true;
  private _watcher: dat.IWatcher;
  private _infoInterval: any;

  constructor(options: DatNotebookModel.IOptions) {
    super();
    this._panel = options.panel;
    this._context = options.context;
    this._manager = options.manager;
    this._icons = options.icons;
  }

  dispose() {
    if (this.isDisposed) {
      return;
    }
    this.unpublish().catch(console.warn);
    this.unsubscribe().catch(console.warn);
    this.unwatchInfo();
    super.dispose();
  }

  get icons() {
    return this._icons;
  }

  get panel() {
    return this._panel;
  }

  get isPublishing() {
    return !!this._publishDat;
  }

  get follow() {
    return this._follow;
  }
  set follow(follow) {
    this._follow = follow;
    this.stateChanged.emit(void 0);
  }

  get autoTrust() {
    return this._autoTrust;
  }
  set autoTrust(autoTrust) {
    this._autoTrust = autoTrust;
    this.stateChanged.emit(void 0);
    each(this.panel.model.cells, model => {
      model.trusted = this._autoTrust;
    });
  }

  get autoRender() {
    return this._autoRender;
  }
  set autoRender(autoRender) {
    this._autoRender = autoRender;
    this.stateChanged.emit(void 0);
  }

  get isSubscribed() {
    return !!this._subscribeDat;
  }

  get canSubscribe() {
    return this.subscribeURLisValid && !this._subscribeDat;
  }

  get subscribeUrl() {
    return this._subscribeUrl;
  }
  set subscribeUrl(subscribeUrl) {
    this._subscribeUrl = subscribeUrl;
    this.stateChanged.emit(void 0);
  }
  get publishUrl() {
    return this._publishUrl;
  }

  get publishInfo() {
    return this._publishInfo;
  }

  get subscribeInfo() {
    return this._subscribeInfo;
  }

  get status() {
    return this._status;
  }
  set status(status) {
    this._status = status;
    this.stateChanged.emit(void 0);
  }

  get filename() {
    return this._context.path.split('/').slice(-1)[0];
  }

  get tabTitle() {
    return `${this.filename} - ${this.status}`;
  }

  get title() {
    return this._title;
  }
  set title(title) {
    this._title = title;
    this.stateChanged.emit(void 0);
    if (this._publishDat) {
      this._publishDat.configure({ title }).catch(console.warn);
    }
  }

  get author() {
    return this._author;
  }
  set author(author) {
    this._author = author;
    this.stateChanged.emit(void 0);
    if (this._publishDat) {
      this._publishDat.configure({ author }).catch(console.warn);
    }
  }

  get description() {
    return this._description;
  }
  set description(description) {
    this._description = description;
    this.stateChanged.emit(void 0);
    if (this._publishDat) {
      this._publishDat.configure({ description }).catch(console.warn);
    }
  }

  get subscribeURLisValid() {
    return !!(this._subscribeUrl || '').match(VALID_DAT);
  }

  private _makeOutputPublisher(model: ICodeCellModel) {
    return async (_outputs: any, _change: any) => {
      await this.publishCellOutputs(model.id, model);
    };
  }

  private _makeSourcePublisher(model: ICellModel) {
    return async (_outputs: any, _change: any) => {
      await this.publishActiveCellIndex(model.id);
      await this.publishCellSource(model.id, model.value.text);
    };
  }

  private _makeMetadataPublisher(model: ICellModel) {
    return async (_metadata: any, _change: any) => {
      await this.publishCellMetadata(
        model.id,
        model.metadata.toJSON() as nbformat.ICellMetadata
      );
    };
  }

  watchInfo() {
    if (this._infoInterval != null) {
      return;
    }
    this._infoInterval = setInterval(
      async () => await this.getInfo(),
      INFO_INTERVAL
    );
  }

  async unwatchInfo() {
    clearInterval(this._infoInterval);
  }

  async onPublish() {
    this.status = 'sharing';
    const { title, description, author } = this;

    this._publishDat = await this._manager.create({
      type: [DAT_NOTEBOOK.name],
      title,
      description,
      author
    });

    this._panel.content.model.cells.changed.connect(
      this.publishCellOrder,
      this
    );

    this._panel.content.activeCellChanged.connect(this.publishActiveCell, this);

    this._panel.content.model.metadata.changed.connect(
      this.publishNotebookMetadata,
      this
    );

    this._publishUrl = this._publishDat.url.split('/').slice(-1)[0];

    await this.publishNotebookMetadata();
    await this.onPublishChange(true);
    await this.getInfo();
    this.watchInfo();
  }

  async unpublish() {
    if (!this._publishDat) {
      return;
    }
    const { _publishDat } = this;
    this._publishDat = null;
    await this._manager.close(_publishDat);
    this._panel.content.model?.cells.changed.disconnect(
      this.publishCellOrder,
      this
    );
    this._panel.content.activeCellChanged.disconnect(
      this.publishActiveCell,
      this
    );
    this._panel.content.model?.metadata.changed.disconnect(
      this.publishNotebookMetadata,
      this
    );
    this.uninstrumentAllCells();
    this.status = 'zzz';
  }

  async getInfo() {
    let infoUpdated = false;
    if (this._publishDat) {
      this._publishInfo = await this._manager.getInfo(this._publishDat.url);
      infoUpdated = true;
    }
    if (this._subscribeDat) {
      this._subscribeInfo = await this._manager.getInfo(this._subscribeDat.url);
      infoUpdated = true;
    }
    if (infoUpdated) {
      this.stateChanged.emit(void 0);
    }
  }

  async onSubscribe() {
    this.status = 'subscribing';
    this._subscribeDat = await this._manager.listen(this.subscribeUrl, {
      sparse: true
    });
    this.status = 'ready';
    this._watcher = this._subscribeDat.watch();

    this._watcher.addEventListener('invalidated', evt =>
      this.onSubscribeChange(evt)
    );
    await this.getInfo();
    await this.onSubscribeChange({ path: null });
    this.watchInfo();
  }

  async unsubscribe() {
    if (!this._subscribeDat) {
      return;
    }
    const { _subscribeDat } = this;
    this._subscribeDat = null;
    await this._manager.close(_subscribeDat);
    delete this._watcher;
  }

  async publishAllCells() {
    const { cells } = this._panel.model;

    let promises = [] as Promise<void>[];
    let cellIds = [] as string[];

    for (let i = 0; i < cells.length; i++) {
      let cell = cells.get(i);
      cellIds.push(cell.id);
      promises.push(this.publishOneCell(cell.id, cell));
    }

    await Promise.all(promises);

    await this.publishCellOrder();
  }

  async publishActiveCellIndex(cellId: string) {
    await this._strategist.save(this._publishDat, cellId, {
      path: DEFAULT_NOTEBOOK,
      jsonPath: ['active_cell']
    });
  }

  async publishActiveCell() {
    const { model } = this._panel.content.activeCell;
    await this.publishActiveCellIndex(model.id);
    await this.publishOneCell(model.id, model);
  }

  async publishCellOrder() {
    const { cells } = this._panel.model;
    const cellIds = [] as string[];
    each(cells, model => {
      const cellId = model.id;
      cellIds.push(cellId);
    });
    await this._strategist.save(
      this._publishDat,
      {
        cellIds
      },
      {
        path: DEFAULT_NOTEBOOK,
        jsonPath: CELL_IDS_PATH
      }
    );
  }

  async publishNotebookMetadata() {
    const metadataJSON = this._panel.content.model.metadata.toJSON();
    await this._strategist.save(this._publishDat, metadataJSON, {
      path: DEFAULT_NOTEBOOK,
      jsonPath: ['metadata']
    });
  }

  async onPublishChange(force = false) {
    this.status = 'publishing';

    if (force) {
      await this.publishAllCells();
    } else {
      const { activeCell } = this._panel.content;
      const { model } = activeCell;
      await this.publishOneCell(model.id, model);
    }

    this.status = 'ready';
  }

  async loadAllCells() {
    const cellIdToModel = await this.loadCellIdToModels();
    const cellIds = await this.loadCellIds();

    let i = 0;
    for (let cellId of cellIds) {
      let model = cellIdToModel.get(cellId);
      if (model == null) {
        model = this._panel.model.cells.get(i);
      }
      await this.loadOneCell(cellId, model);
      i++;
    }
  }

  async fixActiveCell() {
    if (!this._follow) {
      return;
    }
    const cellIds = await this.loadCellIds();

    const activeCell = (await this._strategist.load(this._subscribeDat, {
      path: DEFAULT_NOTEBOOK,
      jsonPath: ['active_cell']
    })) as string;

    const cellIndex = cellIds.indexOf(activeCell);

    if (cellIndex >= 0) {
      this._panel.content.activeCellIndex = cellIds.indexOf(activeCell);

      ElementExt.scrollIntoViewIfNeeded(
        this._panel.content.node,
        this._panel.content.activeCell.node
      );
    }
  }

  cellForModel(model: ICellModel) {
    let { widgets } = this._panel.content;
    for (let cell of widgets) {
      if (cell.model === model) {
        return cell;
      }
    }
    return null;
  }

  instrumentCell(model: ICellModel) {
    if (isCodeCellModel(model) && !this._outputModelPublishers.has(model)) {
      const publisher = this._makeOutputPublisher(model);
      this._outputModelPublishers.set(model, publisher);
      model.outputs.changed.connect(publisher);
    }

    if (!this._metadataModelPublishers.has(model)) {
      const publisher = this._makeMetadataPublisher(model);
      this._metadataModelPublishers.set(model, publisher);
      model.metadata.changed.connect(publisher);
    }

    if (!this._sourceModelPublishers.has(model)) {
      const publisher = this._makeSourcePublisher(model);
      this._sourceModelPublishers.set(model, publisher);
      model.value.changed.connect(publisher);
    }
  }

  uninstrumentAllCells() {
    for (const model of this._outputModelPublishers.keys()) {
      const publisher = this._outputModelPublishers.get(model);
      (model as ICodeCellModel)?.outputs?.changed.disconnect(publisher as any);
      this._outputModelPublishers.delete(model);
    }

    for (const model of this._metadataModelPublishers.keys()) {
      const publisher = this._metadataModelPublishers.get(model);
      model.metadata?.changed.disconnect(publisher as any);
      this._metadataModelPublishers.delete(model);
    }

    for (const model of this._sourceModelPublishers.keys()) {
      const publisher = this._sourceModelPublishers.get(model);
      model?.value.changed.disconnect(publisher as any);
      this._sourceModelPublishers.delete(model);
    }
  }

  async publishOneCell(cellId: string, model: ICellModel) {
    this.instrumentCell(model);

    let modelJSON = model.toJSON();
    let datMeta = modelJSON.metadata.dat || (modelJSON.metadata.dat = {});
    (datMeta as any)['@id'] = cellId;

    let dirInfo: string[];

    try {
      dirInfo = await this._publishDat.readdir(
        [DEFAULT_NOTEBOOK, 'cell', cellId].join('/')
      );
    } catch {
      // doesn't exist
    }

    if (dirInfo && dirInfo.indexOf('output') >= 0) {
      try {
        await this._publishDat.rmdir(
          [DEFAULT_NOTEBOOK, 'cell', cellId, 'output'].join('/'),
          { recursive: true }
        );
      } catch (err) {
        // no big deal
      }
    }

    if (modelJSON.attachments) {
      await this._strategist.save(this._publishDat, modelJSON.attachments, {
        path: DEFAULT_NOTEBOOK,
        jsonPath: ['cell', cellId, 'attachments']
      });
    }

    await this.publishCellMetadata(
      cellId,
      modelJSON.metadata as nbformat.ICellMetadata
    );

    await this.publishCellSource(cellId, model.value.text);

    let cellIndex = {
      cell_type: modelJSON.cell_type,
      execution_count: null as number
    };

    switch (modelJSON.cell_type) {
      case 'code':
        let codeModel = modelJSON as nbformat.ICodeCell;
        cellIndex.execution_count = codeModel.execution_count;
        if (isCodeCellModel(model)) {
          await this.publishCellOutputs(cellId, model);
        }
        break;
      default:
        break;
    }

    await this._strategist.save(this._publishDat, cellIndex, {
      path: DEFAULT_NOTEBOOK,
      jsonPath: ['cell', cellId, 'index']
    });
  }

  async publishCellOutputs(cellId: string, model: ICodeCellModel) {
    let i = 0;
    let codeModel = model.toJSON();
    for (const output of codeModel.outputs) {
      await this._strategist.save(this._publishDat, output, {
        path: DEFAULT_NOTEBOOK,
        jsonPath: ['cell', cellId, 'output', `${i}`]
      });
      i++;
    }
    setTimeout(async () => {
      await this._strategist.save(this._publishDat, model.executionCount, {
        path: DEFAULT_NOTEBOOK,
        jsonPath: ['cell', cellId, 'execution_count']
      });
    }, 100);
  }

  async publishCellMetadata(cellId: string, source: nbformat.ICellMetadata) {
    await this._strategist.save(this._publishDat, source, {
      path: DEFAULT_NOTEBOOK,
      jsonPath: ['cell', cellId, 'metadata']
    });
  }

  async publishCellSource(cellId: string, source: string) {
    await this._strategist.save(this._publishDat, source, {
      path: DEFAULT_NOTEBOOK,
      jsonPath: ['cell', cellId, 'source']
    });
  }

  async loadOneOutput(cellId: string, outputIdx: number) {
    try {
      return (await this._strategist.load(this._subscribeDat, {
        path: DEFAULT_NOTEBOOK,
        jsonPath: ['cell', cellId, 'output', `${outputIdx}`]
      })) as nbformat.IOutput;
    } catch (err) {
      console.warn('error loading output', cellId, outputIdx);
      return null;
    }
  }

  async loadOneSource(cellId: string) {
    return [
      (await this._strategist.load(this._subscribeDat, {
        path: DEFAULT_NOTEBOOK,
        jsonPath: ['cell', cellId, 'source']
      })) as string
    ];
  }

  async loadOneExecutionCount(cellId: string) {
    let executionCount: number = null;
    try {
      executionCount = (await this._strategist.load(this._subscribeDat, {
        path: DEFAULT_NOTEBOOK,
        jsonPath: ['cell', cellId, 'execution_count']
      })) as number;
    } catch (err) {
      console.warn(err);
    }
    return executionCount;
  }

  async loadOneCellMedata(cellId: string) {
    return (await this._strategist.load(this._subscribeDat, {
      path: DEFAULT_NOTEBOOK,
      jsonPath: ['cell', cellId, 'metadata']
    })) as nbformat.ICellMetadata;
  }

  renderOneMarkdownCell(model: ICellModel) {
    for (const widget of this._panel.content.widgets) {
      if (widget.model === model) {
        this._panel.content.deselectAll();
        this._panel.content.select(widget);
        NotebookActions.run(this._panel.content);
        break;
      }
    }
  }

  async loadOneCellIndex(cellId: string) {
    return (await this._strategist.load(this._subscribeDat, {
      path: DEFAULT_NOTEBOOK,
      jsonPath: ['cell', cellId, 'index']
    })) as nbformat.ICell;
  }

  async loadOneCell(cellId: string, model: ICellModel) {
    // read this first
    const cellJSON = await this.loadOneCellIndex(cellId);

    cellJSON.source = await this.loadOneSource(cellId);

    cellJSON.metadata = await this.loadOneCellMedata(cellId);

    const attachments = (await this._strategist.load(this._subscribeDat, {
      path: DEFAULT_NOTEBOOK,
      jsonPath: ['cell', cellId, 'attachments']
    })) as nbformat.IAttachments;

    if (attachments) {
      cellJSON.attachments = attachments;
    }

    if (model.type !== cellJSON.cell_type) {
      this._panel.content.deselectAll();
      this._panel.content.select(this.cellForModel(model));
      NotebookActions.changeCellType(
        this._panel.content,
        cellJSON.cell_type as any
      );
    }

    if (this._autoRender && isMarkdownCellModel(model)) {
      this.renderOneMarkdownCell(model);
    }

    if (cellJSON.cell_type === 'code' && isCodeCellModel(model)) {
      let codeCell = cellJSON as nbformat.ICodeCell;
      codeCell.outputs = [];
      let errored = false;
      let i = 0;
      while (!errored) {
        let output = await this.loadOneOutput(cellId, i);
        if (output) {
          codeCell.outputs[i] = output;
        } else {
          errored = true;
        }
        i++;
      }
      model.executionCount = await this.loadOneExecutionCount(cellId);
    }

    model.value.text = Array.isArray(cellJSON.source)
      ? cellJSON.source.join('')
      : cellJSON.source;

    for (const k of Object.keys(cellJSON.metadata)) {
      model.metadata.set(k, cellJSON.metadata[k]);
    }

    model.metadata.set(METADATA_KEY, {
      '@id': cellId
    });

    if (isCodeCellModel(model)) {
      model.outputs.clear();
      ((cellJSON as nbformat.ICodeCell).outputs || []).map(output => {
        model.outputs.add(output);
      });
    }
  }

  private _loadCellIds: string[];

  async loadCellIds(force = false) {
    if (force || !this._loadCellIds) {
      this._loadCellIds = ((await this._strategist.load(this._subscribeDat, {
        path: DEFAULT_NOTEBOOK,
        jsonPath: CELL_IDS_PATH
      })) as any).cellIds as string[];
    }
    return this._loadCellIds;
  }

  async loadCellIdToModels() {
    const cellIdToModels = new Map<string, ICellModel>();
    each(this._panel.model.cells, model => {
      let cellId = ((model.metadata.get(METADATA_KEY) as any) || {})['@id'];
      if (cellId != null) {
        cellIdToModels.set(cellId, model);
      }
    });
    return cellIdToModels;
  }

  async loadNotebookMetadata() {
    const metadataJSON = ((await this._strategist.load(this._subscribeDat, {
      path: DEFAULT_NOTEBOOK,
      jsonPath: ['metadata']
    })) as any) as nbformat.INotebookMetadata;
    for (const key of Object.keys(metadataJSON || {})) {
      this._panel.content.model.metadata.set(key, metadataJSON[key]);
    }
  }

  async fixCellsOnSubscribe() {
    const { cells } = this._panel.content.model;
    const newCellIds = await this.loadCellIds(true);
    const unmanaged = [] as ICellModel[];
    const oldCellModels = {} as { [key: string]: ICellModel };
    const oldCellIds = [] as string[];
    let needsUpdate = false;
    each(cells, model => {
      const cellId = ((model.metadata.get(METADATA_KEY) as any) || {})['@id'];
      if (cellId == null || newCellIds.indexOf(cellId) === -1) {
        unmanaged.push(model);
        needsUpdate = true;
      } else {
        oldCellModels[cellId] = model;
        oldCellIds.push(cellId);
      }
    });

    const newCellModels = [] as ICellModel[];

    for (const cellId of newCellIds) {
      let model = oldCellModels[cellId];
      if (model == null) {
        const index = await this.loadOneCellIndex(cellId);
        const cellType = index?.cell_type || 'code';
        const source = (await this.loadOneSource(cellId)) || '';

        switch (cellType) {
          case 'markdown':
            model = new MarkdownCellModel({});
            break;
          case 'code':
            model = new CodeCellModel({});
            break;
          case 'raw':
            model = new RawCellModel({});
            break;
          default:
            console.warn('unhandled cell type', cellId, cellType);
            model = new RawCellModel({});
            break;
        }
        (model.metadata as any).set(METADATA_KEY, { '@id': cellId });
        if (this._autoTrust) {
          model.trusted = true;
        }
        model.value.text = Array.isArray(source) ? source.join('') : source;
        needsUpdate = true;
      }
      newCellModels.push(model);
    }

    if (!needsUpdate) {
      for (let i = 0; i < newCellIds.length; i++) {
        if (oldCellIds[i] !== newCellIds[i]) {
          needsUpdate = true;
          break;
        }
      }
    }

    if (needsUpdate) {
      cells.beginCompoundOperation();
      cells.clear();
      cells.insertAll(0, newCellModels);
      cells.endCompoundOperation();
    }
  }

  async onSubscribeChange(_evt: dat.IChangeEvent) {
    const { path } = _evt;
    if (path?.match(NOOP_PATH)) {
      return;
    }
    const jsonPath = (path || '').split('/');
    const jsonPathLength = jsonPath.length;
    this.status = 'updating';

    if (path == null) {
      await this.fixCellsOnSubscribe();
      await this.loadAllCells();
      await this.fixActiveCell();
    } else if (jsonPath.length >= 3 && jsonPath[2] === 'metadata') {
      await this.loadNotebookMetadata();
    } else if (path.endsWith('/cells')) {
      await this.fixCellsOnSubscribe();
    } else if (path.endsWith('/active_cell')) {
      await this.fixActiveCell();
    } else if (jsonPath.length >= 5 && jsonPath[2] === 'cell') {
      const cellId = jsonPath[3];
      const cellIdToModels = await this.loadCellIdToModels();
      const model = cellIdToModels.get(cellId);

      switch (jsonPath[4]) {
        case 'index':
          if (model) {
            await this.loadOneCell(cellId, model);
          }
          break;
        case 'output':
          if (jsonPathLength >= 6 && model && isCodeCellModel(model)) {
            const outputIdx = parseInt(jsonPath[5], 10);
            const output = await this.loadOneOutput(cellId, outputIdx);
            if (output) {
              model.outputs.set(outputIdx, output);
            }
          }
          break;
        case 'execution_count':
          if (model && isCodeCellModel(model)) {
            model.executionCount = await this.loadOneExecutionCount(cellId);
          }
          break;
        case 'metadata':
          if (model) {
            const meta = await this.loadOneCellMedata(cellId);
            for (const key of Object.keys(meta || {})) {
              model.metadata.set(key, meta[key]);
            }
          }
          break;
        case 'source':
          if (model) {
            const source = await this.loadOneSource(cellId);
            model.value.text = Array.isArray(source) ? source.join('') : source;
            if (isMarkdownCellModel(model)) {
              this.renderOneMarkdownCell(model);
            }
          }
          break;
        default:
          break;
      }
    } else {
      console.warn('unhandled path', path);
    }

    this.status = 'ready';
  }
}

export namespace DatNotebookModel {
  export interface IOptions {
    context: DocumentRegistry.IContext<INotebookModel>;
    panel: NotebookPanel;
    manager: IDatManager;
    icons: IIconRegistry;
  }
}
