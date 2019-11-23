import { dat } from '@deathbeds/dat-sdk-webpack';

export class DatManager {
  private _archives = new Map<string, dat.IDatArchive>();
  private _SDK: dat.ISDK;

  private async SDK() {
    if (!this._SDK) {
      const datSDK = await import(
        /* webpackChunkName: "dat-sdk" */ '@deathbeds/dat-sdk-webpack'
      );
      console.log(datSDK);
      this._SDK = datSDK.SDK;
    }
    return this._SDK;
  }

  async create(opts?: dat.IDatArchive.ICreateOptions) {
    const sdk = await this.SDK();
    const d = await sdk.DatArchive.create(opts);
    this._archives.set(d.url, d);
    return d;
  }

  async listen(url: string) {
    const sdk = await this.SDK();
    const d = await sdk.DatArchive.load(url);
    this._archives.set(d.url, d);

    const info = await d.getInfo();
    console.log(info);
    return d;
  }
}
