declare module 'random-access-*' {}

declare module 'dat-sdk/promise' {
  export interface IDatArchive extends EventTarget {
    url: string;
    readFile<T>(
      filepath: string,
      opts: string | IDatArchive.IReadOptions
    ): Promise<T>;
    writeFile(
      filepath: string,
      data: any,
      opts: string | IDatArchive.IWriteOptions
    ): Promise<void>;
    watch(onInvalidated?: IDatArchive.IInvalidated): IWatcher;
    watch(
      pathPattern: string,
      onInvalidated?: IDatArchive.IInvalidated
    ): IWatcher;
    getInfo(): Promise<IDatArchive.IArchiveInfo>;
    stat(filepath: string): Promise<IDatArchive.IStat>;
    mkdir(filepath: string): Promise<void>;
    readdir(
      filepath: string,
      options?: IDatArchive.IReaddirOptions
    ): Promise<string[]>;
    readdir(
      filepath: string,
      options: IDatArchive.IStatReaddirOptions
    ): Promise<IDatArchive.IDirInfo>;
    rmdir(filepath: string, options?: IDatArchive.IRmdirOptions): Promise<void>;
  }
  export interface IWatcher {
    addEventListener(
      evt: 'changed' | 'invalidated' | 'sync',
      callback: IChangeWatcher
    ): void;
  }
  export interface IChangeWatcher {
    (evt: IChangeEvent): void;
  }
  export interface IChangeEvent {
    path: string;
  }
  export namespace IDatArchive {
    export interface ILoadOptions {
      persist?: boolean;
      storage?: Function;
    }
    export interface ICreateOptions extends ILoadOptions {
      title?: string;
      description?: string;
      author?: string;
    }

    export interface IIOOptions {
      encoding: string;
    }
    export interface IReadOptions extends IIOOptions {}
    export interface IWriteOptions extends IIOOptions {}
    export interface IInvalidated {
      (): void;
    }
    export interface IArchiveInfo {
      author: string;
      description: string;
      isOwner: boolean;
      key: string;
      mtime: number;
      peers: number;
      size: number;
      title: string;
      type: string;
      url: string;
      version: number;
    }
    export interface IStat {
      atime: Date;
      blksize: number;
      blocks: number;
      byteOffset: number;
      ctime: Date;
      dev: number;
      downloaded: number;
      gid: number;
      ino: number;
      linkname: string;
      mode: number;
      mtime: Date;
      nlink: number;
      offset: number;
      rdev: number;
      size: number;
      uid: number;
    }
    export interface IReaddirOptions {
      stat?: boolean;
    }
    export interface IStatReaddirOptions extends IReaddirOptions {
      stat: true;
    }
    export interface IDirInfo {
      [key: string]: {
        name: string;
        stat: IStat;
      };
    }
    export interface IRmdirOptions {
      recursive?: boolean;
    }
  }

  export interface IDatArchiveStatic {
    create(opts?: IDatArchive.ICreateOptions): Promise<IDatArchive>;
    load(url: string, options?: IDatArchive.ILoadOptions): Promise<IDatArchive>;
  }

  export interface ISDK {
    DatArchive: IDatArchiveStatic;
  }

  const SDK: ISDK;
  export default SDK;
}
