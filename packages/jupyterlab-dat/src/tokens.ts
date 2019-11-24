import { Token } from '@phosphor/coreutils';
// import { Widget } from '@phosphor/widgets';
// import { Signal } from '@phosphor/signaling';
import { dat } from '@deathbeds/dat-sdk-webpack';

export const NS = '@deathbeds/jupyterlab-dat';

/**
 * A class that tracks dat archives.
 */
export interface IDatManager {
  create(opts?: dat.IDatArchive.ICreateOptions): Promise<dat.IDatArchive>;
  listen(
    url: string,
    opts?: dat.IDatArchive.ILoadOptions
  ): Promise<dat.IDatArchive>;
}

export namespace IDatManager {
  export interface IOptions {}
}

/* tslint:disable */
/**
 * The dat manager token
 */
export const IDatManager = new Token<IDatManager>(`${NS}:IDatManager`);
/* tslint:enable */
