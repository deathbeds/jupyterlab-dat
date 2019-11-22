import * as dat from 'dat-sdk/auto';
const SDK = dat.default;

export class DatManager {
  private _archives = new Map<string, dat.IDatArchive>();

  async create(opts?: dat.ISDK.ICreateOptions) {
    const d = await SDK.create(opts);
    this._archives.set(d.url, d);
    return d;
  }

  async listen(url: string) {
    const d = await SDK.load(url);
    this._archives.set(d.url, d);
    return d;
  }
}
