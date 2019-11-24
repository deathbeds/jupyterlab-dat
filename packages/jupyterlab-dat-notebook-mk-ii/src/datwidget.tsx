import React from 'react';

import { dat } from '@deathbeds/dat-sdk-webpack';
import { each } from '@phosphor/algorithm';
import { ElementExt } from '@phosphor/domutils';
import { Throttler } from '@jupyterlab/coreutils';

import { VDomModel, VDomRenderer } from '@jupyterlab/apputils';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import {
  ICellModel,
  CodeCellModel,
  isCodeCellModel
  // isCodeCellModel
} from '@jupyterlab/cells';
import { NotebookPanel, INotebookModel } from '@jupyterlab/notebook';

import { nbformat } from '@jupyterlab/coreutils';

import { IDatManager } from '@deathbeds/jupyterlab-dat/lib/tokens';
import { ExplodeJSONStrategist } from '@deathbeds/jupyterlab-dat/lib/strategies/explode';

import { CSS } from '.';

const PLACEHOLDER = 'dat://';
const BTN_CLASS = `jp-mod-styled jp-mod-accept ${CSS.BTN.big}`;

const DEFAULT_NOTEBOOK = '/Untitled.ipynb';
const CELL_IDS_PATH = ['cells'];

const handleFocus = (event: React.FocusEvent<HTMLInputElement>) =>
  event.target.select();

export class DatWidget extends VDomRenderer<DatWidget.Model> {
  constructor(options: DatWidget.IOptions) {
    super();
    this.model = new DatWidget.Model(options);
    this.title.iconClass = CSS.ICONS.star;
    this.addClass(CSS.WIDGET);
  }
  protected render() {
    const m = this.model;

    const { title } = m;

    this.title.label = title;

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
    return (
      <section>
        <input
          readOnly={true}
          defaultValue={m.shareUrl}
          className="jp-mod-styled"
          placeholder={PLACEHOLDER}
          onFocus={handleFocus}
        />
        <button className={BTN_CLASS} onClick={async () => await m.onShare()}>
          <label>PUBLISH</label>
          {this.renderShield('create')}
        </button>
        <blockquote>
          Shares the full contents of <code>{m.filename}</code> with the DAT
          peer-to-peer network as JSON fragments. Send the link to anybody with
          <code>jupyterlab-dat</code>.
        </blockquote>
      </section>
    );
  }

  renderShield(icon: string) {
    const props = {
      className: `${CSS.ICONS[icon]} ${CSS.SHIELD}`
    };
    return <div {...props}></div>;
  }

  renderSubscribe(m: DatWidget.Model) {
    return (
      <section>
        <input
          defaultValue={m.loadUrl}
          onChange={e => (m.loadUrl = e.currentTarget.value)}
          placeholder={PLACEHOLDER}
          className="jp-mod-styled"
          onFocus={handleFocus}
        />
        <button className={BTN_CLASS} onClick={async () => await m.onLoad()}>
          <label>SUBSCRIBE</label>
          {this.renderShield('resume')}
        </button>
        <blockquote>
          Replace the in-browser contents of <code>{m.filename}</code> with the
          notebook at the above dat URL, as reconstructed from JSON fragments,
          and watch for changes.
        </blockquote>
      </section>
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
    private _shareUrl: string;
    private _loadUrl: string;
    private _panel: NotebookPanel;
    private _context: DocumentRegistry.IContext<INotebookModel>;
    private _manager: IDatManager;
    private _info: dat.IDatArchive.IArchiveInfo;
    private _throttleRate = 100;
    private _strategist = new ExplodeJSONStrategist();

    constructor(options: DatWidget.IOptions) {
      super();
      this._panel = options.panel;
      this._context = options.context;
      this._manager = options.manager;
    }
    get loadUrl() {
      return this._loadUrl;
    }
    set loadUrl(loadUrl) {
      this._loadUrl = loadUrl;
      this.stateChanged.emit(void 0);
    }
    get shareUrl() {
      return this._shareUrl;
    }

    get info() {
      return this._info;
    }
    set info(info) {
      this._info = info;
      this.stateChanged.emit(void 0);
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

    get title() {
      return `${this.filename} - ${this.status}`;
    }

    async onShare() {
      this.status = 'sharing';
      const title = this._context.path.split('/').slice(-1)[0];
      this._publishDat = await this._manager.create({ title });

      const throttledOnChange = new Throttler<void, any>(
        () => this.onShareChange(),
        this._throttleRate
      );

      this._panel.model.contentChanged.connect(
        async () => await throttledOnChange.invoke()
      );
      this.onShareChange(true);
      this._panel.content.model.cells.changed.connect(async cells => {
        const cellIds = [] as string[];
        each(cells, c => {
          cellIds.push(c.id);
        });
        await this.shareCellOrder(cellIds);
      });
      this._shareUrl = this._publishDat.url;
      this.stateChanged.emit(void 0);
    }

    async onLoad() {
      this.status = 'subscribing';
      this._subscribeDat = await this._manager.listen(this.loadUrl);
      this.info = await this._subscribeDat.getInfo();
      this.status = 'waiting';
      const watcher = this._subscribeDat.watch();

      watcher.addEventListener('invalidated', evt => this.onLoadChange(evt));
      watcher.addEventListener('sync', evt => this.onLoadChange(evt));
      await this.onLoadChange({ path: null });
    }

    async shareAllCells() {
      const { cells } = this._panel.model;

      let promises = [] as Promise<void>[];
      let cellIds = [] as string[];

      for (let i = 0; i < cells.length; i++) {
        let cell = cells.get(i);
        cellIds.push(cell.id);
        promises.push(this.shareOneCell(cell.id, cell));
      }

      await Promise.all(promises);

      await this.shareCellOrder(cellIds);
    }

    async shareCellOrder(cellIds: string[]) {
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

    async shareOneCell(cellId: string, model: ICellModel) {
      let modelJSON = model.toJSON();
      let datMeta = modelJSON.metadata.dat || (modelJSON.metadata.dat = {});
      (datMeta as any)['@id'] = cellId;
      await this._strategist.save(this._publishDat, modelJSON, {
        path: DEFAULT_NOTEBOOK,
        jsonPath: ['cell', cellId]
      });
    }

    async onShareChange(force = false) {
      this.status = 'publishing';

      if (force) {
        await this.shareAllCells();
      } else {
        const { activeCell } = this._panel.content;
        const { model } = activeCell;
        await this.shareOneCell(model.id, model);
      }

      this.status = 'sharing';
    }

    async loadAllCells() {
      const cellIdToModel = await this.cellIdToModels();
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

    async loadOneCell(cellId: string, model: ICellModel) {
      const cellJSON = (await this._strategist.load(this._subscribeDat, {
        path: DEFAULT_NOTEBOOK,
        jsonPath: ['cell', cellId]
      })) as nbformat.ICell;

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
        (cellJSON as nbformat.ICodeCell).outputs.map(output => {
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

    async cellIdToModels() {
      const cellIds = await this.loadCellIds();
      const cellIdToModels = new Map<string, ICellModel>();
      each(this._panel.model.cells, (cell, i) => {
        let cellId = ((cell.metadata.get('dat') as any) || {})['@id'];
        cellId = cellId || cellIds[i];
        cellIdToModels.set(cellId, cell);
      });
      return cellIdToModels;
    }

    async fixCellsOnLoad() {
      this._loadCellIds = null;
      const cellIds = await this.loadCellIds(true);

      const { cells } = this._panel.model;
      if (cells.length < cellIds.length) {
        let i = cells.length;
        while (i < cellIds.length) {
          cells.push(new CodeCellModel({}));
          i++;
        }
      }
    }

    async onLoadChange(_evt: dat.IChangeEvent) {
      const { path } = _evt;
      const jsonPath = (path || '').split('/');
      console.log('loadChange', path);
      const { activeCellIndex } = this._panel.content;
      this.status = 'updating';

      if (path == null || path.endsWith('/cells')) {
        await this.fixCellsOnLoad();
        await this.loadAllCells();
      } else if (jsonPath.length >= 3 && jsonPath[2] === 'cell') {
        const cellIdToModels = await this.cellIdToModels();
        const cellId = jsonPath[3];
        const model = cellIdToModels.get(cellId);
        if (model) {
          await this.loadOneCell(cellId, model);
        } else {
          console.warn('unhandled cellid', cellId);
        }
      } else {
        console.warn('unhandled path', path);
      }

      this._panel.content.activeCellIndex = activeCellIndex;
      ElementExt.scrollIntoViewIfNeeded(
        this._panel.content.node,
        this._panel.content.activeCell.node
      );
      this.status = 'waiting';
    }
  }
}
