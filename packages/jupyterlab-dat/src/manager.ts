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
  // private _RAW: any;
  private _RAM: any;

  private async SDK() {
    if (!this._SDK) {
      const _raw = await import(
        /* webpackChunkName: "dat-sdk" */ '!!raw-loader!@deathbeds/dat-sdk-webpack'
      );
      const script = document.createElement('script');
      script.textContent = _raw.default;
      const promise = new Promise((resolve, reject) => {
        document.body.appendChild(script);
        let i = 100;
        const interval = setInterval(() => {
          const _dat = (window as any).datSdkWebpack;
          i--;
          if (!i) {
            reject('failed to load');
            clearInterval(interval);
          }
          if (_dat) {
            clearInterval(interval);
            this._SDK = _dat.dat.default({
              swarmOpts: {
                discovery: NOTEBOOK_SERVER_DISCOVERY
              }
            });
            this._RAM = _dat.RAM.default;
            resolve(void 0);
          }
        }, 10);
      });
      try {
        await promise;
      } catch (err) {
        console.warn(err);
      }
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
