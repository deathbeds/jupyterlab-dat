import { Token } from '@phosphor/coreutils';

import { IDatManager } from '@deathbeds/jupyterlab-dat';
import { dat } from '@deathbeds/dat-sdk-webpack';
import { DatIdentityModel } from './model';
export const NS = '@deathbeds/jupyterlab-dat-identity';
export const ID = `${NS}:IDatIdentityManager`;

/**
 * A class that tracks dat archives.
 */
export interface IDatIdentityManager {
  getModel(peer?: dat.IHyperdrive.IPeer): Promise<DatIdentityModel>;
  datManager: IDatManager;
}

export namespace IDatIdentityManager {
  export interface IOptions {
    datManager: IDatManager;
  }
}

/* tslint:disable */
/**
 * The dat manager token
 */
export const IDatIdentityManager = new Token<IDatIdentityManager>(ID);
/* tslint:enable */
