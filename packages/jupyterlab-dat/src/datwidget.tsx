import React from 'react';

import { dat } from '@deathbeds/dat-sdk-webpack';

import { VDomModel, VDomRenderer } from '@jupyterlab/apputils';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { NotebookPanel, INotebookModel } from '@jupyterlab/notebook';

import { DatManager } from './manager';

import { CSS } from '.';

export class DatWidget extends VDomRenderer<DatWidget.Model> {
  constructor(options: DatWidget.IOptions) {
    super();
    this.model = new DatWidget.Model(options);
    this.title.iconClass = CSS.ICON;
  }
  protected render() {
    const m = this.model;

    const { title, shareUrl, loadUrl } = m;

    this.title.label = title;

    return (
      <div className={CSS.WIDGET}>
        <div>
          <input
            readOnly={true}
            size={70}
            defaultValue={shareUrl}
            className="jp-mod-styled"
          />
          <button
            className="jp-mod-styled"
            onClick={async () => await m.onShare()}
          >
            share
          </button>
        </div>
        <div>
          <input
            defaultValue={loadUrl}
            size={70}
            onChange={e => (m.loadUrl = e.currentTarget.value)}
            placeholder="dat://"
            className="jp-mod-styled"
          />
          <button
            className="jp-mod-styled"
            onClick={async () => await m.onLoad()}
          >
            load
          </button>
        </div>
        <pre>{JSON.stringify(m.info || {}, null, 2)}</pre>
      </div>
    );
  }
}

export namespace DatWidget {
  export interface IOptions {
    context: DocumentRegistry.IContext<INotebookModel>;
    panel: NotebookPanel;
    manager: DatManager;
  }

  export class Model extends VDomModel {
    private _status: string = 'zzz';
    private _dat: dat.IDatArchive;
    private _shareUrl: string;
    private _loadUrl: string;
    private _panel: NotebookPanel;
    private _context: DocumentRegistry.IContext<INotebookModel>;
    private _manager: DatManager;
    private _info: dat.IDatArchive.IArchiveInfo;

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

    get title() {
      const path = this._context.path.split('/').slice(-1)[0];
      return `${path} - ${this.status}`;
    }

    async onShare() {
      this.status = 'sharing';
      const title = this._context.path.split('/').slice(-1)[0];
      this._dat = await this._manager.create({ title });
      const onChange = async () => {
        this.status = 'publishing';
        await this._dat.writeFile(
          `/Untitled.ipynb`,
          JSON.stringify(this._panel.model.toJSON()),
          'utf-8'
        );
        this.status = 'published';
        this.info = await this._dat.getInfo();
        this.status = 'sharing';
      };
      this._panel.model.contentChanged.connect(onChange);
      onChange();
      this._shareUrl = this._dat.url;
      this.stateChanged.emit(void 0);
    }

    async onLoad() {
      this.status = 'subscribing';
      this._dat = await this._manager.listen(this.loadUrl);
      this.info = await this._dat.getInfo();
      this.status = 'waiting';
      const watcher = this._dat.watch();
      const onChange = async (_evt: any) => {
        this.status = 'updating';
        const content = await this._dat.readFile<string>(
          '/Untitled.ipynb',
          'utf-8'
        );
        this._context.model.fromJSON(JSON.parse(content));
        this.status = 'updated';
        this.info = await this._dat.getInfo();
        this.status = 'waiting';
      };
      watcher.addEventListener('invalidated', onChange);
      await onChange(void 0);
    }
  }
}
