import React from 'react';

import { dat } from '@deathbeds/dat-sdk-webpack';
import { each } from '@phosphor/algorithm';
import { ElementExt } from '@phosphor/domutils';
import { Debouncer } from '@jupyterlab/coreutils';

import { VDomModel, VDomRenderer } from '@jupyterlab/apputils';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import {
  ICellModel,
  CodeCellModel,
  Cell,
  isCodeCellModel
  // isCodeCellModel
} from '@jupyterlab/cells';
import {
  NotebookPanel,
  INotebookModel,
  NotebookActions
} from '@jupyterlab/notebook';

import { nbformat } from '@jupyterlab/coreutils';

import { IDatManager } from '@deathbeds/jupyterlab-dat/lib/tokens';
import { ExplodeJSONStrategist } from '@deathbeds/jupyterlab-dat/lib/strategies/explode';

import { CSS } from '.';

const PLACEHOLDER = 'dat://';
const BTN_CLASS = `jp-mod-styled ${CSS.BTN.big}`;

const DEFAULT_NOTEBOOK = '/Untitled.ipynb';
const CELL_IDS_PATH = ['cells'];
const INFO_INTERVAL = 10000;

const handleFocus = (event: React.FocusEvent<HTMLInputElement>) =>
  event.target.select();

export class DatWidget extends VDomRenderer<DatWidget.Model> {
  constructor(options: DatWidget.IOptions) {
    super();
    this.model = new DatWidget.Model(options);
    this.title.iconClass = CSS.ICONS.star;
    this.addClass(CSS.WIDGET);
    this.addClass('jp-dat-mkii');
  }
  protected render() {
    const m = this.model;

    const { tabTitle } = m;

    this.title.label = tabTitle;

    const props = {
      className: `${CSS.MAIN} jp-RenderedHTMLCommon`
    };

    return (
      <div {...props}>
        {this.renderPublish(m)}
        {this.renderSubscribe(m)}
        <h1>mkii</h1>
      </div>
    );
  }

  renderPublish(m: DatWidget.Model) {
    const buttonProps = {
      disabled: !!m.publishUrl,
      onClick: async () => await m.onPublish(),
      className: BTN_CLASS + (!m.isPublishing ? ' jp-mod-accept' : '')
    };
    return (
      <section>
        <input
          readOnly={true}
          defaultValue={m.publishUrl}
          className="jp-mod-styled"
          placeholder={PLACEHOLDER}
          onFocus={handleFocus}
        />
        <button {...buttonProps}>
          <label>{m.isPublishing ? 'PUBLISHING' : 'PUBLISH'}</label>
          {this.renderShield('create')}
        </button>
        {this.renderPublishInfo(m)}
        {this.renderInfoForm(m)}
      </section>
    );
  }

  renderInfoForm(m: DatWidget.Model) {
    return (
      <details>
        <summary>Manifest</summary>
        <label>
          <i>Title</i>
          <input
            defaultValue={m.title}
            className="jp-mod-styled"
            onChange={evt => (m.title = evt.currentTarget.value)}
          />
        </label>
        <label>
          <i>Author</i>
          <input
            defaultValue={m.author}
            className="jp-mod-styled"
            onChange={evt => (m.author = evt.currentTarget.value)}
          />
        </label>
        <label>
          <i>Description</i>
          <textarea
            defaultValue={m.description}
            className="jp-mod-styled"
            onChange={evt => (m.description = evt.currentTarget.value)}
            rows={5}
          />
        </label>
      </details>
    );
  }

  renderPublishInfo(m: DatWidget.Model) {
    if (m.isPublishing && m.publishInfo) {
      return this.renderInfo(m.publishInfo);
    } else {
      return (
        <blockquote>
          <i>
            Publish the full contents of <code>{m.filename}</code> with the DAT
            peer-to-peer network as JSON fragments. Send the link to anybody
            with <code>jupyterlab-dat</code>.
          </i>
        </blockquote>
      );
    }
  }

  renderShield(icon: string) {
    const props = {
      className: `${CSS.ICONS[icon]} ${CSS.SHIELD}`
    };
    return <div {...props}></div>;
  }

  renderSubscribe(m: DatWidget.Model) {
    const buttonProps = {
      className:
        BTN_CLASS + (m.loadUrl && !m.isSubscribed ? ' jp-mod-accept' : ''),
      disabled: !m.loadUrl || m.isSubscribed,
      onClick: async () => await m.onSubscribe()
    };
    return (
      <section>
        <input
          defaultValue={m.loadUrl}
          onChange={e => (m.loadUrl = e.currentTarget.value)}
          placeholder={PLACEHOLDER}
          className="jp-mod-styled"
          onFocus={handleFocus}
        />
        <button {...buttonProps}>
          <label>{m.isSubscribed ? 'SUBSCRIBED' : 'SUBSCRIBE'}</label>
          {this.renderShield('resume')}
        </button>
        {this.renderSubscribeInfo(m)}
      </section>
    );
  }

  renderSubscribeInfo(m: DatWidget.Model) {
    if (m.isSubscribed && m.subscribeInfo) {
      return this.renderInfo(m.subscribeInfo);
    } else {
      return (
        <blockquote>
          <i>
            Replace the in-browser contents of <code>{m.filename}</code> with
            the notebook at the above dat URL, as reconstructed from JSON
            fragments, and watch for changes.
          </i>
        </blockquote>
      );
    }
  }

  renderInfo(info: dat.IDatArchive.IArchiveInfo) {
    let author = '';

    if (info.author) {
      if (typeof info.author === 'string') {
        author = info.author;
      } else if (info.author.name) {
        author = info.author.name;
      }
    }

    return (
      <table>
        <thead>
          <tr>
            <th>Version</th>
            <th>Peers</th>
            <th>Title</th>
            <th>Description</th>
            <th>Author</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{info.version || 0}</td>
            <td>{info.peers || 0}</td>
            <td>{info.title || ''}</td>
            <td>{info.description || ''}</td>
            <td>{author}</td>
          </tr>
        </tbody>
      </table>
    );
  }
}

export namespace DatWidget {
  export interface IOptions {
    context: DocumentRegistry.IContext<INotebookModel>;
    panel: NotebookPanel;
    manager: IDatManager;
  }

  export class Model extends VDomModel {
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

    constructor(options: DatWidget.IOptions) {
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

    private _previousPublishActive: Cell;

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
      this.onPublishChange(true);
      this._panel.content.model.cells.changed.connect(async cells => {
        const cellIds = [] as string[];
        each(cells, c => {
          cellIds.push(c.id);
        });
        await this.publishCellOrder(cellIds);
      });
      this._panel.content.activeCellChanged.connect(async (_notebook, cell) => {
        if (this._previousPublishActive) {
          await this.publishOneCell(
            this._previousPublishActive.model.id,
            this._previousPublishActive.model
          );
          this._previousPublishActive = cell;
        }
        await this.publishOneCell(cell.model.id, cell.model);
      });
      this._publishUrl = this._publishDat.url;
      this.stateChanged.emit(void 0);
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

      watcher.addEventListener('invalidated', evt =>
        this.onSubscribeChange(evt)
      );
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
        cellJSON.attachments = (await this._strategist.load(
          this._subscribeDat,
          {
            path: DEFAULT_NOTEBOOK,
            jsonPath: ['cell', cellId, 'attachments']
          }
        )) as nbformat.IAttachments;
      } catch {
        //
      }

      if (cellJSON.cell_type === 'code') {
        let codeCell = cellJSON as nbformat.ICodeCell;
        codeCell.outputs = [];
        let errored = false;
        let i = 0;
        while (!errored) {
          try {
            codeCell.outputs.push(
              (await this._strategist.load(this._subscribeDat, {
                path: DEFAULT_NOTEBOOK,
                jsonPath: ['cell', cellId, 'output', `${i}`]
              })) as nbformat.IOutput
            );
          } catch {
            errored = true;
          }
          i++;
        }
      }

      if (model.type !== cellJSON.cell_type) {
        this._panel.content.select(this.cellForModel(model));
        NotebookActions.changeCellType(
          this._panel.content,
          cellJSON.cell_type as any
        );
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
      } else if (path.endsWith('/cells')) {
        await this.fixCellsonSubscribe();
      } else if (jsonPath.length >= 3 && jsonPath[2] === 'cell') {
        // for now, only load on a full index change
        if (jsonPath[4] === 'index') {
          const cellIdToModels = await this.loadCellIdToModels();
          const cellId = jsonPath[3];
          const model = cellIdToModels.get(cellId);
          if (model) {
            await this.loadOneCell(cellId, model);
          } else {
            console.warn('no model for', cellId);
          }
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
}
