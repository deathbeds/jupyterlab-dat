import { PageConfig, URLExt } from '@jupyterlab/coreutils';
import { dat } from '@deathbeds/dat-sdk-webpack';

const NOTEBOOK_SERVER_DISCOVERY =
  URLExt.join(
    PageConfig.getBaseUrl().replace(/^http/, 'ws'),
    'discovery-swarm-web'
  ) + '/';

export class DatManager {
  private _archives = new Map<string, dat.IDatArchive>();
  private _SDK: dat.ISDK;
  private _RAM: any;

  private async SDK() {
    if (!this._SDK) {
      const _dat = await import(
        /* webpackChunkName: "dat-sdk" */ '@deathbeds/dat-sdk-webpack'
      );
      this._SDK = (_dat.dat as any).default({
        swarmOpts: {
          discovery: NOTEBOOK_SERVER_DISCOVERY
        }
      });
    }
    return this._SDK;
  }

  async create(opts?: dat.IDatArchive.ICreateOptions) {
    const sdk = await this.SDK();
    const d = await sdk.DatArchive.create({
      ...opts,
      persist: false,
      storage: this._RAM
    });
    this._archives.set(d.url, d);
    return d;
  }

  async listen(url: string, opts?: dat.IDatArchive.ILoadOptions) {
    const sdk = await this.SDK();
    const d = await sdk.DatArchive.load(url, {
      ...opts,
      persist: false,
      storage: this._RAM
    });
    this._archives.set(d.url, d);
    return d;
  }
}
