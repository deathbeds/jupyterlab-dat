import React from 'react';

import { VDomRenderer, VDomModel } from '@jupyterlab/apputils';

import { CSS } from '.';
import { IDatManager } from './tokens';
import { Title, Widget } from '@phosphor/widgets';

export class DatSidebarHeader extends VDomRenderer<DatSidebarHeader.Model> {
  constructor(options: DatSidebarHeader.IOptions) {
    super();
    this.model = new DatSidebarHeader.Model(options);
    this.addClass(`${CSS.SIDEBAR}-Header`);
    this.title.changed.connect(this.render, this);
  }

  protected render() {
    const m = this.model;
    return (
      <header>
        {m.icons.iconReact({
          name: m.title.icon,
          className: `${CSS.SIDEBAR}-Header-icon`
        })}
        <label>{m.title.label}</label>
      </header>
    );
  }
}

export namespace DatSidebarHeader {
  export interface IOptions {
    manager: IDatManager;
    title: Title<Widget>;
  }

  export class Model extends VDomModel {
    private _manager: IDatManager;
    private _title: Title<Widget>;

    constructor(options: IOptions) {
      super();
      this._manager = options.manager;
      this._title = options.title;
    }

    get icons() {
      return this._manager.icons;
    }

    get title() {
      return this._title;
    }
  }
}
