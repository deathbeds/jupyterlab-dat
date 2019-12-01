import { dat } from '@deathbeds/dat-sdk-webpack';

import { PageConfig, URLExt } from '@jupyterlab/coreutils';
import { ISignal, Signal } from '@phosphor/signaling';
import { IIconRegistry } from '@jupyterlab/ui-components';

import { IDatManager, CSS } from '.';
import { Widget } from '@phosphor/widgets';

const NOTEBOOK_SERVER_DISCOVERY =
  URLExt.join(
    PageConfig.getBaseUrl().replace(/^http/, 'ws'),
    'discovery-swarm-web'
  ) + '/';

const SIDEBAR_DEFAULTS = {
  rank: 100,
  title: 'Untitled',
  icon: 'dat-hexagon-outlines'
};

export class DatManager implements IDatManager {
  private _SDK: dat.ISDK;
  private _RAM: any;
  private _datTypes = new Map<string, IDatManager.IDatType>();
  private _datUrls = new Set<string>();
  private _datsChanged = new Signal<IDatManager, void>(this);
  private _infoChanged = new Signal<IDatManager, void>(this);
  private _sidebarItemsChanged = new Signal<IDatManager, void>(this);
  private _createdArchives = new Map<string, dat.IDatArchive>();
  private _listenedArchives = new Map<string, dat.IDatArchive>();
  private _archiveInfo = new Map<string, dat.IDatArchive.IArchiveInfo>();
  private _icons: IIconRegistry;
  private _sidebarItems = new Map<Widget, IDatManager.ISidebarItemOptions>();

  private _extensions = new Map<string, Set<IDatManager.IExtensionListener>>();

  constructor(options: IDatManager.IOptions) {
    this._icons = options.icons;
  }

  get icons() {
    return this._icons;
  }

  get datUrls() {
    return this._datUrls;
  }

  get datsChanged(): ISignal<IDatManager, void> {
    return this._datsChanged;
  }

  get infoChanged(): ISignal<IDatManager, void> {
    return this._infoChanged;
  }

  get sidebarItemsChanged(): ISignal<IDatManager, void> {
    return this._sidebarItemsChanged;
  }

  private async SDK() {
    if (!this._SDK) {
      const _dat = await import(
        /* webpackChunkName: "dat-sdk" */ '@deathbeds/dat-sdk-webpack'
      );
      this._SDK = (_dat.dat as any).default({
        swarmOpts: {
          discovery: NOTEBOOK_SERVER_DISCOVERY
        }
      });
    }
    return this._SDK;
  }

  async create(opts?: dat.IDatArchive.ICreateOptions) {
    const sdk = await this.SDK();
    const registeredExtensions = Array.from(this._extensions.keys());
    const extensions = [...(opts.extensions || []), ...registeredExtensions];
    const archive = await sdk.DatArchive.create({
      ...opts,
      persist: false,
      storage: this._RAM,
      extensions
    });

    this.addExtensionListeners(archive);

    this._datUrls.add(archive.url);
    this._datsChanged.emit(void 0);
    this._createdArchives.set(archive.url, archive);

    return archive;
  }

  private addExtensionListeners(archive: dat.IDatArchive) {
    archive._archive.on('extension', (name, message, peer) => {
      const registered = this._extensions.get(name);
      if (registered) {
        registered.forEach(listener => {
          listener(archive, name, message, peer);
        });
      }
    });
  }

  async listen(url: string, opts?: dat.IDatArchive.ILoadOptions) {
    const sdk = await this.SDK();
    const extensions = [
      ...(opts.extensions || []),
      ...Array.from(this._extensions.keys())
    ];
    const archive = await sdk.DatArchive.load(url, {
      ...opts,
      persist: false,
      storage: this._RAM,
      extensions
    });

    this.addExtensionListeners(archive);

    this._datUrls.add(archive.url);
    this._datsChanged.emit(void 0);
    this._listenedArchives.set(archive.url, archive);

    return archive;
  }

  getArchive(url: string): dat.IDatArchive {
    return this._createdArchives.get(url) || this._listenedArchives.get(url);
  }

  currentInfo(url: string): dat.IDatArchive.IArchiveInfo {
    return this._archiveInfo.get(url);
  }

  async getInfo(url: string): Promise<dat.IDatArchive.IArchiveInfo> {
    let changed = false;
    if (this._createdArchives.has(url)) {
      this._archiveInfo.set(
        url,
        await this._createdArchives.get(url).getInfo()
      );
      changed = true;
    } else if (this._listenedArchives.has(url)) {
      this._archiveInfo.set(
        url,
        await this._listenedArchives.get(url).getInfo()
      );
      changed = true;
    }
    if (changed) {
      this._infoChanged.emit(void 0);
    }
    return this._archiveInfo.get(url);
  }

  async close(archive: dat.IDatArchive): Promise<void> {
    await archive.close();
    this._listenedArchives.delete(archive.url);
    this._createdArchives.delete(archive.url);
    this._datUrls.delete(archive.url);
    this._datsChanged.emit(void 0);
  }

  registerExtension(
    name: string,
    listener: IDatManager.IExtensionListener
  ): void {
    const listeners =
      this._extensions.get(name) || new Set<IDatManager.IExtensionListener>();
    if (!listeners.has(listener)) {
      listeners.add(listener);
      this._extensions.set(name, listeners);
    }
  }

  unregisterExtension(
    name: string,
    listener: IDatManager.IExtensionListener
  ): void {
    const listeners =
      this._extensions.get(name) || new Set<IDatManager.IExtensionListener>();
    if (listeners.has(listener)) {
      listeners.delete(listener);
      this._extensions.set(name, listeners);
    }
  }

  registerDatType(datType: IDatManager.IDatType) {
    this._datTypes.set(datType.name, datType);
  }

  unregisterDatType(datType: IDatManager.IDatType) {
    this._datTypes.delete(datType.name);
  }

  getDatTypeInfo(archiveUrl: string) {
    let info = this.currentInfo(archiveUrl);
    let types = [] as IDatManager.IDatType[];
    if (info && info.type) {
      types = (Array.isArray(info.type)
        ? (info.type as string[])
        : [info.type]
      ).reduce((memo, type) => {
        if (this._datTypes.has(type)) {
          memo.push(this._datTypes.get(type));
        } else {
          memo.push({
            name: type,
            label: type,
            icon: CSS.ICON_NAMES.question
          });
        }
        return memo;
      }, [] as IDatManager.IDatType[]);
    }

    if (types.length === 0) {
      types.push({
        name: 'unknown',
        label: 'Unknown',
        icon: CSS.ICON_NAMES.question
      });
    }

    return types;
  }

  addSidebarItem(
    widget: Widget,
    options: Partial<IDatManager.ISidebarItemOptions> = {}
  ) {
    if (!this._sidebarItems.has(widget)) {
      this._sidebarItems.set(widget, { ...SIDEBAR_DEFAULTS, ...options });
      this._sidebarItemsChanged.emit(void 0);
    }
  }

  removeSidebarItem(widget: Widget) {
    this._sidebarItems.delete(widget);
    this._sidebarItemsChanged.emit(void 0);
  }

  get sidebarItems() {
    return Array.from(this._sidebarItems.entries());
  }
}
