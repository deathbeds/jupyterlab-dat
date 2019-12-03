import { Token } from '@phosphor/coreutils';
import { Widget } from '@phosphor/widgets';
import { ISignal } from '@phosphor/signaling';

import { IIconRegistry } from '@jupyterlab/ui-components';
import { dat } from '@deathbeds/dat-sdk-webpack';

export const NS = '@deathbeds/jupyterlab-dat';

/**
 * A class that tracks dat archives.
 */
export interface IDatManager {
  // services
  icons: IIconRegistry;
  // extensions
  registerExtension(
    name: string,
    listener: IDatManager.IExtensionListener
  ): void;
  unregisterExtension(
    name: string,
    listener: IDatManager.IExtensionListener
  ): void;

  registerDatType(datType: IDatManager.IDatType): void;
  unregisterDatType(datType: IDatManager.IDatType): void;
  getDatTypeInfo(archiveUrl: string): IDatManager.IDatType[];

  // widgets
  addSidebarItem(
    widget: Widget,
    options?: Partial<IDatManager.ISidebarItemOptions>
  ): void;
  removeSidebarItem(widget: Widget): void;
  sidebarItems: IDatManager.TSidebarItems;

  // signals
  datsChanged: ISignal<IDatManager, void>;
  infoChanged: ISignal<IDatManager, void>;
  sidebarItemsChanged: ISignal<IDatManager, void>;

  // properties
  datUrls: Set<string>;
  // archive stuff
  create(opts?: dat.IDatArchive.ICreateOptions): Promise<dat.IDatArchive>;
  listen(
    url: string,
    opts?: dat.IDatArchive.ILoadOptions
  ): Promise<dat.IDatArchive>;
  close(archive: dat.IDatArchive): Promise<void>;
  getArchive(url: string): dat.IDatArchive;
  getInfo(url: string): Promise<dat.IDatArchive.IArchiveInfo>;
  currentInfo(url: string): dat.IDatArchive.IArchiveInfo;
}

export namespace IDatManager {
  export type TSidebarItems = [Widget, ISidebarItemOptions][];
  export interface IOptions {
    icons: IIconRegistry;
  }
  export interface IExtensionListener {
    (
      archive: dat.IDatArchive,
      name: string,
      message: Buffer,
      peer: dat.IHyperdrive.IPeer
    ): void;
  }
  export interface ISidebarItemOptions {
    rank: number;
    title: string;
    icon: string;
  }
  export interface IDatType {
    icon: string;
    label: string;
    name: string;
  }
}

/* tslint:disable */
/**
 * The dat manager token
 */
export const IDatManager = new Token<IDatManager>(`${NS}:IDatManager`);
/* tslint:enable */
