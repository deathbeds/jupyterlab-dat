import { dat } from '@deathbeds/dat-sdk-webpack';
import { each } from '@phosphor/algorithm';
import { ElementExt } from '@phosphor/domutils';
import { Debouncer } from '@jupyterlab/coreutils';

import { VDomModel } from '@jupyterlab/apputils';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import {
  ICellModel,
  CodeCellModel,
  ICodeCellModel,
  isCodeCellModel
} from '@jupyterlab/cells';
import {
  NotebookPanel,
  INotebookModel,
  NotebookActions
} from '@jupyterlab/notebook';

import { nbformat } from '@jupyterlab/coreutils';

import { IDatManager } from '@deathbeds/jupyterlab-dat/lib/tokens';
import { ExplodeJSONStrategist } from '@deathbeds/jupyterlab-dat/lib/strategies/explode';

const DEFAULT_NOTEBOOK = '/Untitled.ipynb';
const CELL_IDS_PATH = ['cells'];
const INFO_INTERVAL = 10000;

export class DatNotebookModel extends VDomModel {
  private _status: string = 'zzz';
  private _publishDat: dat.IDatArchive;
  private _subscribeDat: dat.IDatArchive;
  private _publishUrl: string;
  private _loadUrl: string;
  private _panel: NotebookPanel;
  private _context: DocumentRegistry.IContext<INotebookModel>;
  private _manager: IDatManager;
  private _publishInfo: dat.IDatArchive.IArchiveInfo;
  private _subscribeInfo: dat.IDatArchive.IArchiveInfo;
  private _throttleRate = 100;
  private _strategist = new ExplodeJSONStrategist();
  private _title: string;
  private _author: string;
  private _description: string;

  constructor(options: DatNotebookModel.IOptions) {
    super();
    this._panel = options.panel;
    this._context = options.context;
    this._manager = options.manager;
    setInterval(async () => await this.getInfo(), INFO_INTERVAL);
  }

  get isPublishing() {
    return !!this._publishDat;
  }

  get isSubscribed() {
    return !!this._subscribeDat;
  }

  get loadUrl() {
    return this._loadUrl;
  }
  set loadUrl(loadUrl) {
    this._loadUrl = loadUrl;
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

  private _outputModelPublishers = new Map<string, Function>();

  private _makeOutputPublisher(model: ICodeCellModel) {
    return async (outputs: any, change: any) => {
      console.log('writing outputs', model.id, change, outputs);
      await this.publishOutputs(model.id, model.toJSON());
      console.log('writing outputs', model.id);
    };
  }

  async onPublish() {
    this.status = 'sharing';
    const { title, description, author } = this;

    this._publishDat = await this._manager.create({
      type: 'notebook',
      title,
      description,
      author
    });

    const throttledOnChange = new Debouncer<void, any>(
      () => this.onPublishChange(),
      this._throttleRate
    );

    this._panel.model.contentChanged.connect(
      async () => await throttledOnChange.invoke()
    );

    this._panel.content.model.cells.changed.connect(async cells => {
      const cellIds = [] as string[];
      each(cells, model => {
        const cellId = model.id;
        cellIds.push(cellId);
      });
      await this.publishCellOrder(cellIds);
    });

    this._panel.content.activeCellChanged.connect(async (_notebook, cell) => {
      await this.publishOneCell(cell.model.id, cell.model);
    });

    this._panel.content.model.metadata.changed.connect(async () => {
      await this.publishMetadata();
    });

    this._publishUrl = this._publishDat.url;

    await this.publishMetadata();
    await this.onPublishChange(true);
    await this.getInfo();
  }

  async getInfo() {
    let infoUpdated = false;
    if (this._publishDat) {
      this._publishInfo = await this._publishDat.getInfo();
      infoUpdated = true;
    }
    if (this._subscribeDat) {
      this._subscribeInfo = await this._subscribeDat.getInfo();
      infoUpdated = true;
    }
    if (infoUpdated) {
      this.stateChanged.emit(void 0);
    }
  }

  async onSubscribe() {
    this.status = 'subscribing';
    this._subscribeDat = await this._manager.listen(this.loadUrl);
    this.status = 'ready';
    const watcher = this._subscribeDat.watch();

    watcher.addEventListener('invalidated', evt => this.onSubscribeChange(evt));
    watcher.addEventListener('sync', evt => this.onSubscribeChange(evt));
    await this.getInfo();
    await this.onSubscribeChange({ path: null });
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

    await this.publishCellOrder(cellIds);
  }

  async publishCellOrder(cellIds: string[]) {
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

  async publishMetadata() {
    await this._strategist.save(
      this._publishDat,
      this._panel.content.model.metadata.toJSON(),
      {
        path: DEFAULT_NOTEBOOK,
        jsonPath: ['metadata']
      }
    );
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

  cellForModel(model: ICellModel) {
    let { widgets } = this._panel.content;
    for (let cell of widgets) {
      if (cell.model === model) {
        return cell;
      }
    }
    return null;
  }

  async publishOneCell(cellId: string, model: ICellModel) {
    console.log('about to write cell', cellId);

    if (isCodeCellModel(model) && !this._outputModelPublishers.has(cellId)) {
      console.log('subscribing to outputs', cellId);
      const publisher = this._makeOutputPublisher(model);
      this._outputModelPublishers.set(cellId, publisher);
      model.outputs.changed.connect(publisher);
    }

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

    await this._strategist.save(this._publishDat, modelJSON.metadata, {
      path: DEFAULT_NOTEBOOK,
      jsonPath: ['cell', cellId, 'metadata']
    });

    await this._strategist.save(this._publishDat, modelJSON.source, {
      path: DEFAULT_NOTEBOOK,
      jsonPath: ['cell', cellId, 'source']
    });

    let cellIndex = {
      cell_type: modelJSON.cell_type,
      execution_count: null as number
    };

    switch (modelJSON.cell_type) {
      case 'code':
        let i = 0;
        let codeModel = modelJSON as nbformat.ICodeCell;
        cellIndex.execution_count = codeModel.execution_count;
        if (isCodeCellModel(model)) {
          console.log('\twriting cell', cellId);
          await this.publishOutputs(cellId, codeModel);
        }
        for (const output of codeModel.outputs) {
          await this._strategist.save(this._publishDat, output, {
            path: DEFAULT_NOTEBOOK,
            jsonPath: ['cell', cellId, 'output', `${i}`]
          });
          i++;
        }
        break;
      default:
        break;
    }

    await this._strategist.save(this._publishDat, modelJSON.source, {
      path: DEFAULT_NOTEBOOK,
      jsonPath: ['cell', cellId, 'source']
    });

    // write this last
    await this._strategist.save(this._publishDat, cellIndex, {
      path: DEFAULT_NOTEBOOK,
      jsonPath: ['cell', cellId, 'index']
    });

    console.log('wrote cell', cellId);
  }

  async publishOutputs(cellId: string, codeModel: nbformat.ICodeCell) {
    let i = 0;
    for (const output of codeModel.outputs) {
      await this._strategist.save(this._publishDat, output, {
        path: DEFAULT_NOTEBOOK,
        jsonPath: ['cell', cellId, 'output', `${i}`]
      });
      i++;
    }
  }

  async loadOneOutput(cellId: string, outputIdx: number) {
    try {
      return (await this._strategist.load(this._subscribeDat, {
        path: DEFAULT_NOTEBOOK,
        jsonPath: ['cell', cellId, 'output', `${outputIdx}`]
      })) as nbformat.IOutput;
    } catch {
      return null;
    }
  }

  async loadOneCell(cellId: string, model: ICellModel) {
    // read this first
    const cellJSON = (await this._strategist.load(this._subscribeDat, {
      path: DEFAULT_NOTEBOOK,
      jsonPath: ['cell', cellId, 'index']
    })) as nbformat.ICell;

    cellJSON.source = (await this._strategist.load(this._subscribeDat, {
      path: DEFAULT_NOTEBOOK,
      jsonPath: ['cell', cellId, 'source']
    })) as nbformat.MultilineString;

    cellJSON.metadata = (await this._strategist.load(this._subscribeDat, {
      path: DEFAULT_NOTEBOOK,
      jsonPath: ['cell', cellId, 'metadata']
    })) as nbformat.ICellMetadata;

    try {
      cellJSON.attachments = (await this._strategist.load(this._subscribeDat, {
        path: DEFAULT_NOTEBOOK,
        jsonPath: ['cell', cellId, 'attachments']
      })) as nbformat.IAttachments;
    } catch {
      //
    }

    if (model.type !== cellJSON.cell_type) {
      this._panel.content.select(this.cellForModel(model));
      NotebookActions.changeCellType(
        this._panel.content,
        cellJSON.cell_type as any
      );
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
    }

    if (isCodeCellModel(model)) {
      model.executionCount = (cellJSON as nbformat.ICodeCell).execution_count;
    }

    model.value.text = Array.isArray(cellJSON.source)
      ? cellJSON.source.join('')
      : cellJSON.source;

    for (const k of Object.keys(cellJSON.metadata)) {
      model.metadata.set(k, cellJSON.metadata[k]);
    }

    model.metadata.set('dat', {
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
      let cellId = ((model.metadata.get('dat') as any) || {})['@id'];
      if (cellId != null) {
        cellIdToModels.set(cellId, model);
      }
    });
    return cellIdToModels;
  }

  async loadMetadata() {
    const metadata = ((await this._strategist.load(this._subscribeDat, {
      path: DEFAULT_NOTEBOOK,
      jsonPath: ['metadata']
    })) as any) as nbformat.INotebookMetadata;
    for (const key of Object.keys(metadata)) {
      this._panel.content.model.metadata.set(key, metadata[key]);
    }
  }

  async fixCellsonSubscribe() {
    const { cells } = this._panel.content.model;
    const newCellIds = await this.loadCellIds(true);
    const unmanaged = [] as ICellModel[];
    const oldCellModels = {} as { [key: string]: ICellModel };
    const oldCellIds = [] as string[];
    let needsUpdate = false;
    each(cells, model => {
      const cellId = ((model.metadata.get('dat') as any) || {})['@id'];
      if (cellId == null || newCellIds.indexOf(cellId) === -1) {
        unmanaged.push(model);
        needsUpdate = true;
      } else {
        oldCellModels[cellId] = model;
        oldCellIds.push(cellId);
      }
    });

    const newCellModels = newCellIds.map(cellId => {
      let model = oldCellModels[cellId];
      if (model == null) {
        model = new CodeCellModel({});
        (model.metadata as any).set('dat', { '@id': cellId });
        needsUpdate = true;
      }
      return model;
    });

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
    const jsonPath = (path || '').split('/');
    const { activeCellIndex } = this._panel.content;
    this.status = 'updating';

    if (path == null) {
      await this.fixCellsonSubscribe();
      await this.loadAllCells();
    } else if (jsonPath.length >= 3 && jsonPath[2] === 'metadata') {
      await this.loadMetadata();
    } else if (path.endsWith('/cells')) {
      await this.fixCellsonSubscribe();
    } else if (jsonPath.length >= 4 && jsonPath[2] === 'cell') {
      const cellId = jsonPath[3];
      // for now, only load on a full index change
      if (jsonPath[4] === 'index') {
        const cellIdToModels = await this.loadCellIdToModels();
        const model = cellIdToModels.get(cellId);
        if (model) {
          await this.loadOneCell(cellId, model);
        }
      } else if (jsonPath.length >= 6 && jsonPath[4] === 'output') {
        const cellIdToModels = await this.loadCellIdToModels();
        const model = cellIdToModels.get(cellId);
        if (model && isCodeCellModel(model)) {
          const outputIdx = parseInt(jsonPath[5], 10);
          const output = await this.loadOneOutput(cellId, outputIdx);
          if (output) {
            console.log('setting output', cellId, outputIdx);
            model.outputs.set(outputIdx, output);
          }
        }
      } else {
        console.log('unhandled path', jsonPath);
      }
    } else {
      console.warn('unhandled path', path);
    }

    this._panel.content.activeCellIndex = activeCellIndex;
    ElementExt.scrollIntoViewIfNeeded(
      this._panel.content.node,
      this._panel.content.activeCell.node
    );
    this.status = 'ready';
  }
}

export namespace DatNotebookModel {
  export interface IOptions {
    context: DocumentRegistry.IContext<INotebookModel>;
    panel: NotebookPanel;
    manager: IDatManager;
  }
}
