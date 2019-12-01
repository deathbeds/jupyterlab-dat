import { dat } from '@deathbeds/dat-sdk-webpack';

import { VDomModel } from '@jupyterlab/apputils';
import { Signal } from '@phosphor/signaling';

import { IDatChatManager } from './tokens';

export class DatChatModel extends VDomModel {
  private _messages: DatChatModel.IMessage[] = [];
  private _manager: IDatChatManager;
  private _nextUrl = '';
  private _archiveInfo: dat.IDatArchive.IArchiveInfo;
  private _chatRequested = new Signal<DatChatModel, void>(this);

  constructor(options: DatChatModel.IOptions) {
    super();
    this._manager = options.manager;
    this._datManager.datsChanged.connect(() => {
      this.stateChanged.emit(void 0);
    });
    this._datManager.infoChanged.connect(() => {
      this.stateChanged.emit(void 0);
    });
  }

  private get _datManager() {
    return this._manager.identityManager.datManager;
  }

  get me() {
    return this._manager.identityManager.me;
  }

  get chatRequested() {
    return this._chatRequested;
  }

  get icons() {
    return this._datManager.icons;
  }

  get handle() {
    return this.me.handle;
  }
  set handle(handle) {
    this.me.handle = handle;
    this.stateChanged.emit(void 0);
  }

  get urls() {
    return Array.from(this._datManager.datUrls);
  }

  get infos() {
    return this.urls.reduce((memo, url) => {
      memo[url] = this._datManager.currentInfo(url);
      return memo;
    }, {} as { [key: string]: dat.IDatArchive.IArchiveInfo });
  }

  get archiveInfo() {
    return this._archiveInfo;
  }

  get nextUrl() {
    const { urls } = this;
    if (!this._nextUrl && urls.length) {
      this._nextUrl = urls[0];
    }
    return this._nextUrl;
  }
  set nextUrl(nextUrl) {
    this._nextUrl = nextUrl;
    this.stateChanged.emit(void 0);
    this.updateArchiveInfo();
  }

  datTypes(archiveUrl: string) {
    return this._datManager.getDatTypeInfo(archiveUrl);
  }

  updateArchiveInfo() {
    this._datManager.getInfo(this._nextUrl).then(info => {
      this._archiveInfo = info;
      this.stateChanged.emit(void 0);
    });
  }

  requestChat() {
    this._manager.requestWidget(this.nextUrl).catch(console.warn);
  }

  addMessage(url: string, message: Buffer, peer?: dat.IHyperdrive.IPeer) {
    this._messages.push({ url, message, peer });
    this.stateChanged.emit(void 0);
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
    manager: IDatChatManager;
  }
}
