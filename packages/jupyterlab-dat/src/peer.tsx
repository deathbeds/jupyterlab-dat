import React from 'react';

import { Widget } from '@phosphor/widgets';

import { VDomRenderer, VDomModel } from '@jupyterlab/apputils';

import { IIconRegistry } from '@jupyterlab/ui-components';

import { IDatManager } from './tokens';

import { CSS } from '.';
import { dat } from '@deathbeds/dat-sdk-webpack';

export class DatPeer extends VDomRenderer<DatPeer.Model> {
  constructor(options?: Widget.IOptions) {
    super(options);
    this.addClass(`${CSS.PEER}`);
  }

  protected render() {
    const m = this.model;

    if (!m) {
      return <div />;
    }

    const props = {
      className: m.peer ? CSS.OTHER : CSS.SELF
    };

    return (
      <label>
        <div {...props}>{m.icons.iconReact({ name: 'dat-hexagon-chat' })}</div>
        <span title={m.handle}>{m.handle}</span>
      </label>
    );
  }
}

export namespace DatPeer {
  export interface IOptions {
    manager: IDatManager;
    icons: IIconRegistry;
  }

  export class Model extends VDomModel {
    private _icons: IIconRegistry;
    private _manager: IDatManager;
    private _peer: dat.IHyperdrive.IPeer;
    private _handle: string;

    constructor(options: IOptions) {
      super();
      this._icons = options.icons;
      this._manager = options.manager;
      console.log(this._manager);
    }

    get icons() {
      return this._icons;
    }

    get handle() {
      return this._handle;
    }

    set handle(handle) {
      this._handle = handle;
      this.stateChanged.emit(void 0);
    }

    get peer() {
      return this._peer;
    }

    set peer(peer) {
      this._peer = peer;
      this.stateChanged.emit(void 0);
    }
  }
}
