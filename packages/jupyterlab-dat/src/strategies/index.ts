import { dat } from '@deathbeds/dat-sdk-webpack';

export interface IStrategist<T> {
  save(
    archive: dat.IDatArchive,
    data: T,
    options?: IStrategist.IOptions
  ): Promise<void>;
  load(archive: dat.IDatArchive, options?: IStrategist.IOptions): Promise<T>;
}

export namespace IStrategist {
  export interface IOptions {
    encoding?: string;
    path?: string;
  }
}
