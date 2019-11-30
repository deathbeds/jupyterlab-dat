import { VDomModel } from '@jupyterlab/apputils';

import { IDatIdentityManager } from './tokens';

import { dat } from '@deathbeds/dat-sdk-webpack';

import { ID } from './tokens';

export class DatIdentityModel extends VDomModel {
  private _manager: IDatIdentityManager;
  private _handle: string = '';
  private _archive: dat.IDatArchive;
  private _bio: string = '';
  private _peer: dat.IHyperdrive.IPeer;

  constructor(options: DatIdentityModel.IOptions) {
    super();
    this._manager = options.manager;
    this._peer = options.peer;
  }

  async publish() {
    this._archive = await this._manager.datManager.create({
      title: this.handle,
      description: this.bio,
      type: [ID]
    });
    this._archive.configure({
      author: {
        name: this.handle,
        url: this._archive.url
      }
    });
    this.stateChanged.emit(void 0);
  }

  get isPublishing() {
    return !this._peer && !!this._archive;
  }

  get publishUrl() {
    return this._archive ? this._archive.url : '';
  }

  get icons() {
    return this._manager.datManager.icons;
  }

  get handle() {
    return this._handle;
  }

  set handle(handle) {
    this._handle = handle;
    if (!this.peer && this._archive) {
      this._archive.configure({ title: this._handle }).catch(console.warn);
    }
    this.stateChanged.emit(void 0);
  }

  get peer() {
    return this._peer;
  }

  set peer(peer) {
    this._peer = peer;
    this.stateChanged.emit(void 0);
  }

  get bio() {
    return this._bio;
  }

  set bio(bio) {
    this._bio = bio;
    if (!this.peer && this._archive) {
      this._archive.configure({ description: this._bio }).catch(console.warn);
    }
    this.stateChanged.emit(void 0);
  }
}

export namespace DatIdentityModel {
  export interface IOptions {
    manager: IDatIdentityManager;
    peer?: dat.IHyperdrive.IPeer;
  }
}
