declare module 'dat-sdk/auto' {
  export interface IDatArchive extends EventTarget {
    url: string;
    readFile<T>(filepath: string, opts: string | IDatArchive.IReadOptions): Promise<T>;
    writeFile(filepath: string, data: any, opts: string | IDatArchive.IWriteOptions): Promise<void>;
    watch(onInvalidated?: IDatArchive.IInvalidated): IWatcher;
    watch(pathPattern: string, onInvalidated?: IDatArchive.IInvalidated): IWatcher;
  }
  export interface IWatcher {
    on(evt: 'changed', callback: IChangeWatcher): void;
  }
  export interface IChangeWatcher {
    (evt: IChangeEvent): void;
  }
  export interface IChangeEvent {}
  export namespace IDatArchive {
    export interface IOptions extends IIOOptions {}
    export interface IIOOptions {
      encoding: string;
    }
    export interface IReadOptions extends IIOOptions {}
    export interface IWriteOptions extends IIOOptions {}
    export interface IInvalidated {
      (): void;
    }
  }

  export interface ISDK {
    load(url: string, options?: IDatArchive.IOptions): Promise<IDatArchive>;
    create(opts?: ISDK.ICreateOptions): Promise<IDatArchive>;
    DatArchive(): IDatArchive;
  }

  export namespace ISDK {
    export interface ICreateOptions {
      title?: string;
    }
    export interface IOptions {
      storageOpts: {
        storageLocation: string;
      }
    }
  }

  const SDK: ISDK;
  export default SDK;
}
