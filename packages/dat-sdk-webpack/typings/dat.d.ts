declare module 'random-access-*' {}

declare module 'dat-sdk/promise' {
  export interface IHyperdrive {
    peers: IHyperdrive.IPeer[];
    on(event: 'close', listener: Function): void;
    on(event: 'error', listener: IHyperdrive.IErrorListener): void;
    on(event: 'extension', listener: IHyperdrive.IExtensionListener): void;
    on(event: 'peer-add', listener: IHyperdrive.IPeerListener): void;
    on(event: 'peer-remove', listener: IHyperdrive.IPeerListener): void;
    on(event: 'ready', listener: Function): void;
  }

  export namespace IHyperdrive {
    export interface IExtensionListener {
      (name: string, message: Buffer, peer: IPeer): void;
    }

    export interface IPeerListener {
      (peer: IPeer): void;
    }

    export interface IErrorListener {
      (err: any): void;
    }

    export interface IPeer {
      extension(name: string, message: Buffer): void;
    }
  }

  export interface IDatArchive extends EventTarget {
    url: string;
    _archve: IHyperdrive;
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
    configure(options: IDatArchive.IConfigureOptions): Promise<void>;
    close(): Promise<void>;
  }
  export type TWatchEvent = 'changed' | 'invalidated' | 'sync';
  export interface IWatcher {
    addEventListener(evt: TWatchEvent, callback: IChangeWatcher): void;
    removeEventListener(evt: TWatchEvent, callback: IChangeWatcher): void;
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
      sparse?: boolean;
      extension?: string[];
    }
    export interface IConfigureOptions {
      title?: string;
      description?: string;
      type?: string | string[];
      author?:
        | string
        | {
            name: string;
            url?: string;
          };
    }
    export interface ICreateOptions extends ILoadOptions, IConfigureOptions {}
    export interface IIOOptions {
      encoding: string;
    }
    export interface IReadOptions extends IIOOptions {}
    export interface IWriteOptions extends IIOOptions {}
    export interface IInvalidated {
      (): void;
    }
    export interface IArchiveInfo extends IConfigureOptions {
      isOwner: boolean;
      key: string;
      mtime: number;
      peers: number;
      size: number;
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
