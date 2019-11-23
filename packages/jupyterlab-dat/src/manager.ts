import { dat } from '@deathbeds/dat-sdk-webpack';

export class DatManager {
  private _archives = new Map<string, dat.IDatArchive>();
  private _SDK: dat.ISDK;

  private async SDK() {
    if (!this._SDK) {
      this._SDK = (await import('@deathbeds/dat-sdk-webpack')).SDK;
    }
    return this._SDK;
  }

  async create(opts?: dat.ISDK.ICreateOptions) {
    const sdk = await this.SDK();
    const d = await sdk.create(opts);
    this._archives.set(d.url, d);
    return d;
  }

  async listen(url: string) {
    const sdk = await this.SDK();
    const d = await sdk.load(url);
    this._archives.set(d.url, d);
    return d;
  }
}
