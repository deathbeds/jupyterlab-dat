import { PageConfig, URLExt } from '@jupyterlab/coreutils';
import { dat } from '@deathbeds/dat-sdk-webpack';

import { IDatManager } from '.';

const NOTEBOOK_SERVER_DISCOVERY =
  URLExt.join(
    PageConfig.getBaseUrl().replace(/^http/, 'ws'),
    'discovery-swarm-web'
  ) + '/';

export class DatManager implements IDatManager {
  private _SDK: dat.ISDK;
  private _RAM: any;

  private _extensions = new Map<string, Set<IDatManager.IExtensionListener>>();

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
    const extensions = [...(opts.extension || []), ...registeredExtensions];
    const archive = await sdk.DatArchive.create({
      ...opts,
      persist: false,
      storage: this._RAM,
      extension: extensions
    });

    archive._archve.on('extension', (name, message, peer) => {
      const registered = this._extensions.get(name);
      if (registered) {
        registered.forEach(listener => listener(archive, name, message, peer));
      }
    });

    return archive;
  }

  async listen(url: string, opts?: dat.IDatArchive.ILoadOptions) {
    const sdk = await this.SDK();
    const extension = [
      ...(opts.extension || []),
      ...Array.from(this._extensions.keys())
    ];
    const d = await sdk.DatArchive.load(url, {
      ...opts,
      persist: false,
      storage: this._RAM,
      extension
    });
    return d;
  }

  async close(archive: dat.IDatArchive): Promise<void> {
    await archive.close();
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
}
