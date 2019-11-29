import React from 'react';

import { VDomRenderer } from '@jupyterlab/apputils';

import { CSS } from '.';

import { DatChatModel } from './model';

export class DatChat extends VDomRenderer<DatChatModel> {
  constructor(options: DatChatModel.IOptions) {
    super();
    this.model = new DatChatModel(options);
    this.title.iconClass = CSS.DAT.ICONS.happy;
    this.addClass(CSS.WIDGET);
  }

  protected render() {
    const m = this.model;

    const options = m.urls.map((url, idx) => {
      return (
        <option key={idx} value={url}>
          {url.replace('dat://', '').slice(0, 5)}
        </option>
      );
    });

    const messages = this.renderMessages(m);

    const textProps = {
      defaultValue: m.nextMessage,
      onChange: (evt: React.FormEvent<HTMLTextAreaElement>) => {
        m.nextMessage = evt.currentTarget.value;
      }
    };

    const buttonProps = {
      className: 'jp-mod-styled jp-mod-accept',
      onClick: () => m.sendMessage()
    };

    return (
      <div className={`${CSS.WIDGET}-Main`}>
        <header>
          {m.icons.iconReact({ name: 'dat-happy-dat' })}
          <select>{options}</select>
        </header>
        {messages}
        <footer>
          <textarea {...textProps}></textarea>
          <button {...buttonProps}>SEND</button>
        </footer>
      </div>
    );
  }

  renderMessages(m: DatChatModel) {
    return (
      <section>
        {m.messages.map((msg, i) => {
          return (
            <div key={i}>
              <span>{`${msg.peer}`}</span>
              <span>{`${msg.message.toString()}`}</span>
            </div>
          );
        })}
      </section>
    );
  }
}
