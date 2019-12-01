import { BoxPanel, BoxLayout } from '@phosphor/widgets';

import { DatChat } from './widget';

import { CSS } from '.';
import { IDatChatManager } from './tokens';

export class Chatbook extends BoxPanel {
  private _datChat: DatChat;

  constructor(options: Chatbook.IOptions) {
    super();
    this.addClass(CSS.WIDGET);
    this.title.caption = 'Chat';
    this.title.iconClass = CSS.DAT.ICONS.chat;
    this._datChat = new DatChat({ manager: options.manager });
    this.boxLayout.direction = 'top-to-bottom';
    this.boxLayout.addWidget(this._datChat);
  }

  get boxLayout() {
    return this.layout as BoxLayout;
  }
}

export namespace Chatbook {
  export interface IOptions {
    manager: IDatChatManager;
  }
}
