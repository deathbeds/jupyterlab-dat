import { dat } from '@deathbeds/dat-sdk-webpack';

import { IMarkdownCellModel } from '@jupyterlab/cells';
import { VDomModel } from '@jupyterlab/apputils';

import { IDatIdentityManager } from '@deathbeds/jupyterlab-dat-identity/lib/tokens';
import { ID } from '.';

export class DatChatModel extends VDomModel {
  private _messages: DatChatModel.IMessage[] = [];
  private _manager: IDatIdentityManager;
  private _nextUrl = '';
  private _archiveInfo: dat.IDatArchive.IArchiveInfo;
  private _handle = 'Anon';

  constructor(options: DatChatModel.IOptions) {
    super();
    this._manager = options.manager;
    this._datManager.datsChanged.connect(() => {
      this.stateChanged.emit(void 0);
    });
  }

  get icons() {
    return this._datManager.icons;
  }

  get handle() {
    return this._handle;
  }
  set handle(handle) {
    this._handle = handle;
    this.stateChanged.emit(void 0);
  }

  private get _datManager() {
    return this._manager.datManager;
  }

  get urls() {
    return Array.from(this._manager.datManager.datUrls);
  }

  get archiveInfo() {
    return this._archiveInfo;
  }

  updateArchiveInfo() {
    this._datManager.getInfo(this._nextUrl).then(info => {
      this._archiveInfo = info;
      this.stateChanged.emit(void 0);
    });
  }

  get nextUrl() {
    const nextUrl = this._nextUrl || this.urls.length ? this.urls[0] : null;
    if (nextUrl && !this._archiveInfo) {
      this.updateArchiveInfo();
    }
    return nextUrl;
  }
  set nextUrl(nextUrl) {
    this._nextUrl = nextUrl;
    this.stateChanged.emit(void 0);
    this.updateArchiveInfo();
  }

  addMessage(url: string, message: Buffer, peer?: dat.IHyperdrive.IPeer) {
    this._messages.push({ url, message, peer });
    this.stateChanged.emit(void 0);
  }

  sendMarkdown(model: IMarkdownCellModel) {
    const url = this.nextUrl;
    const archive = this._datManager.getArchive(url);
    const modelJson = model.toJSON();
    const buffer = Buffer.from(JSON.stringify(modelJson, null, 2));
    archive._archive.extension(ID, buffer);
    return buffer;
  }
}

export namespace DatChatModel {
  export interface IMessage {
    url: string;
    message: Buffer;
    peer: dat.IHyperdrive.IPeer;
  }
  export interface IIdentity {
    handle: string;
  }
  export interface IOptions {
    manager: IDatIdentityManager;
  }
}
