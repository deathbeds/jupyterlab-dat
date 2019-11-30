import { IDatIdentityManager } from './tokens';
import { IDatManager } from '@deathbeds/jupyterlab-dat';
import { dat } from '@deathbeds/dat-sdk-webpack';
import { DatIdentityModel } from './model';

export class DatIdentityManager implements IDatIdentityManager {
  private _peerModels = new Map<dat.TBitField, DatIdentityModel>();
  private _manager: IDatManager;
  private _me: DatIdentityModel;

  constructor(options: IDatIdentityManager.IOptions) {
    this._manager = options.datManager;
    this._me = new DatIdentityModel({ 
      manager: this 
    });
  }

  get datManager() {
    return this._manager;
  }

  async getModel(peer?: dat.IHyperdrive.IPeer) {
    if(!peer) {
      return this._me;
    }
    if (!this._peerModels.has(peer.remoteID)) {
      this._peerModels.set(
        peer.remoteID,
        new DatIdentityModel({
          manager: this,
          peer
        })
      );
    }

    return this._peerModels.get(peer.remoteID);
  }
}