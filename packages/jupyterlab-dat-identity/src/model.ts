import { VDomModel } from '@jupyterlab/apputils';

import { IDatIdentityManager } from './tokens';

import { dat } from '@deathbeds/dat-sdk-webpack';

export class DatIdentityModel extends VDomModel {
  private _manager: IDatIdentityManager;
  private _peer: dat.IHyperdrive.IPeer;
  private _handle: string;

  constructor(options: DatIdentityModel.IOptions) {
    super();
    this._manager = options.manager;
    this._peer = options.peer;
  }

  get icons() {
    return this._manager.datManager.icons;
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

export namespace DatIdentityModel {
  export interface IOptions {
    manager: IDatIdentityManager;
    peer?: dat.IHyperdrive.IPeer;
  }
}
