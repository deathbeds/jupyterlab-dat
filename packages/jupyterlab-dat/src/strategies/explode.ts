import { JSONValue } from '@phosphor/coreutils';

import { dat } from '@deathbeds/dat-sdk-webpack';

import { IStrategist } from '.';

import { DEFAULT_ENCODING } from './naive';

export class ExplodeJSONStrategist implements IStrategist<JSONValue> {
  async save(
    archive: dat.IDatArchive,
    data: JSONValue,
    opts: ExplodeJSONStrategist.IOptions
  ): Promise<void> {
    archive.writeFile(
      this.toPath(opts),
      JSON.stringify(data, null, 2),
      DEFAULT_ENCODING
    );
  }
  async load(
    archive: dat.IDatArchive,
    opts: ExplodeJSONStrategist.IOptions
  ): Promise<JSONValue> {
    return JSON.parse(
      await archive.readFile<string>(this.toPath(opts), DEFAULT_ENCODING)
    );
  }

  toPath({ path, jsonPath }: ExplodeJSONStrategist.IOptions): string {
    return [path, ...jsonPath].join('/');
  }
}

export namespace ExplodeJSONStrategist {
  export interface IOptions extends IStrategist.IOptions {
    path: string;
    jsonPath: string[];
  }
}
