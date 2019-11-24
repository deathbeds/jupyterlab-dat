import { IStrategist } from '.';

import { dat } from '@deathbeds/dat-sdk-webpack';

const DEFAULT_ENCODING = 'utf-8';

export class NaiveStrategist implements IStrategist<string> {
  async save(
    archive: dat.IDatArchive,
    data: string,
    opts: NaiveStrategist.IOptions
  ): Promise<void> {
    archive.writeFile(opts.path, data, opts.encoding || DEFAULT_ENCODING);
  }
  async load(
    archive: dat.IDatArchive,
    opts: NaiveStrategist.IOptions
  ): Promise<string> {
    return await archive.readFile<string>(
      opts.path,
      opts.encoding || DEFAULT_ENCODING
    );
  }
}

export namespace NaiveStrategist {
  export interface IOptions extends IStrategist.IOptions {
    path: string;
  }
}
