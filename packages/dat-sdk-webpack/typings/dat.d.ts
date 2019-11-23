declare module "random-access-*" {}

declare module "dat-sdk/promise" {
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
  }
  export interface IWatcher {
    addEventListener(
      evt: "changed" | "invalidated",
      callback: IChangeWatcher
    ): void;
  }
  export interface IChangeWatcher {
    (evt: IChangeEvent): void;
  }
  export interface IChangeEvent {}
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
