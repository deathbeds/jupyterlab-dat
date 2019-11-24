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
    const { jsonPath, path } = opts;
    const finalPath = this.toPath(opts);
    let i = 0;
    while (i < jsonPath.length) {
      const parentPath = this.toPath({
        path,
        jsonPath: jsonPath.slice(0, i)
      });
      if (parentPath === finalPath) {
        break;
      }
      console.log('mkdir', parentPath);
      try {
        await archive.mkdir(parentPath);
      } catch (err) {
        console.warn(err);
      }
      i++;
    }
    console.log('write', finalPath);
    archive.writeFile(
      finalPath,
      JSON.stringify(data, null, 2),
      DEFAULT_ENCODING
    );
  }
  async load(
    archive: dat.IDatArchive,
    opts: ExplodeJSONStrategist.IOptions
  ): Promise<JSONValue> {
    const path = this.toPath(opts);
    console.log('load', path);
    return JSON.parse(await archive.readFile<string>(path, DEFAULT_ENCODING));
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
