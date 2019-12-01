import React from 'react';

import { VDomRenderer } from '@jupyterlab/apputils';

import { CSS } from '.';

import { DatChatModel } from './model';

import { renderBigButton } from '@deathbeds/jupyterlab-dat/lib/fragments';

export class DatChat extends VDomRenderer<DatChatModel> {
  constructor(options: DatChatModel.IOptions) {
    super();
    this.model = new DatChatModel(options);
    this.title.iconClass = CSS.DAT.ICONS.chat;
    this.addClass(CSS.WIDGET);
  }

  onUrlChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    this.model.nextUrl = evt.currentTarget.value;
  };

  onChatClicked = () => {
    this.model.requestChat();
  };

  protected render() {
    const m = this.model;
    const { infos, urls, nextUrl } = m;

    const options = urls.map((url, idx) => {
      let info = infos[url];
      let label = url;
      let peers = '?';
      if (info) {
        label = info.title || 'Untitled';
        peers = `${info.peers == null ? '?' : info.peers}`;
      }
      const checked = url === nextUrl;

      let datTypes = m.datTypes(url).map((datType, key) => {
        return (
          <i key={key} title={datType.label}>
            {m.icons.iconReact({ name: datType.icon })}
          </i>
        );
      });

      return (
        <li key={idx} className={checked ? CSS.DAT.JP.active : ''}>
          <label>
            <input
              type="radio"
              name="next-dat-chat-url"
              checked={checked}
              value={url}
              onChange={this.onUrlChange}
            />
            <div>
              <section>
                <span>{label}</span>
                <small>
                  {m.icons.iconReact({ name: CSS.DAT.ICON_NAMES.network })}
                  {peers}
                </small>
              </section>
              <section>{datTypes}</section>
            </div>
          </label>
        </li>
      );
    });

    return (
      <div className={`${CSS.WIDGET}-Main`}>
        <header>
          <ul className={`${CSS.WIDGET}-Urls`}>{options}</ul>
        </header>
        {renderBigButton({
          label: 'CHAT',
          icon: CSS.DAT.ICON_NAMES.chat,
          icons: m.icons,
          className: nextUrl ? CSS.DAT.JP.accept : '',
          props: {
            disabled: !nextUrl,
            onClick: this.onChatClicked
          }
        })}
      </div>
    );
  }
}
