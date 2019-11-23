import React from 'react';

import { dat } from '@deathbeds/dat-sdk-webpack';

import { VDomModel, VDomRenderer } from '@jupyterlab/apputils';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { NotebookPanel, INotebookModel } from '@jupyterlab/notebook';

import { DatManager } from './manager';

import { ICON_CLASS } from '.';

export class DatWidget extends VDomRenderer<DatWidget.Model> {
  constructor(options: DatWidget.IOptions) {
    super();
    this.model = new DatWidget.Model(options);
    this.title.label = options.context.path.split('/').slice(-1)[0];
    this.title.iconClass = ICON_CLASS;
  }
  protected render() {
    const m = this.model;
    return (
      <div>
        <div>
          <input readOnly={true} value={m.shareUrl} />
          <button onClick={async () => await m.onShare()}>share</button>
        </div>
        <div>
          <input
            defaultValue={m.loadUrl}
            onChange={e => (m.loadUrl = e.currentTarget.value)}
            placeholder="dat://"
          />
          <button onClick={async () => await m.onLoad()}>load</button>
        </div>
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
    private _dat: dat.IDatArchive;
    private _shareUrl: string;
    private _loadUrl: string;
    // private _panel: NotebookPanel;
    private _context: DocumentRegistry.IContext<INotebookModel>;
    private _manager: DatManager;

    constructor(options: DatWidget.IOptions) {
      super();
      // this._panel = options.panel;
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

    async onShare() {
      const title = this._context.path.split('/').slice(-1)[0];
      const dat = await this._manager.create({ title });
      const onChange = () => {
        dat.writeFile(
          `${this._context.model.toJSON()}`,
          `/Untitled.ipynb`,
          'utf-8'
        );
      };
      this._context.model.contentChanged.connect(onChange);
      onChange();
      this._shareUrl = dat.url;
      this.stateChanged.emit(void 0);
    }

    async onLoad() {
      this._dat = await this._manager.listen(this.loadUrl);
      const watcher = this._dat.watch();
      watcher.addEventListener('invalidated', async evt => {
        console.log(evt);
        const content = await this._dat.readFile<string>(
          '/Untitled.ipynb',
          'utf-8'
        );
        this._context.model.fromJSON(JSON.parse(content));
      });
    }
  }
}
