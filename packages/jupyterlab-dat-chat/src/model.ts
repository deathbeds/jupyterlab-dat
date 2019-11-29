import { dat } from '@deathbeds/dat-sdk-webpack';

import { VDomModel } from '@jupyterlab/apputils';
import { IIconRegistry } from '@jupyterlab/ui-components';

import { IDatManager } from '@deathbeds/jupyterlab-dat/lib/tokens';
import { ID } from '.';

export class DatChatModel extends VDomModel {
  private _icons: IIconRegistry;
  private _messages: DatChatModel.IMessage[] = [];
  private _manager: IDatManager;
  private _nextMessage = '';
  private _nextUrl = '';

  constructor(options: DatChatModel.IOptions) {
    super();
    this._icons = options.icons;
    this._manager = options.manager;
    this._manager.datsChanged.connect(() => {
      this.stateChanged.emit(void 0);
    });
  }

  get messages() {
    return this._messages;
  }

  get nextMessage() {
    return this._nextMessage;
  }

  set nextMessage(nextMessage) {
    this._nextMessage = nextMessage;
    this.stateChanged.emit(void 0);
  }

  get icons() {
    return this._icons;
  }

  get urls() {
    return Array.from(this._manager.datUrls);
  }

  addMessage(url: string, message: Buffer, peer: dat.IHyperdrive.IPeer) {
    this._messages.push({ url, message, peer });
    this.stateChanged.emit(void 0);
  }

  sendMessage() {
    const url = this._nextUrl || this.urls[0];
    const archive = this._manager.getArchive(url);
    const buffer = Buffer.from(this._nextMessage);
    console.log('sending extension message', archive);
    archive._archive.extension(ID, buffer);
    this._nextMessage = '';
    this.addMessage(url, buffer, null);
  }
}

export namespace DatChatModel {
  export interface IMessage {
    url: string;
    message: Buffer;
    peer: dat.IHyperdrive.IPeer;
  }
  export interface IOptions {
    manager: IDatManager;
    icons: IIconRegistry;
  }
}
