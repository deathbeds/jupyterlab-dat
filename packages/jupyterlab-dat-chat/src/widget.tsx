import React from 'react';

import { VDomRenderer } from '@jupyterlab/apputils';

import { CSS } from '.';

import { DatChatModel } from './model';

import {
  renderBigButton,
  renderDatURL
} from '@deathbeds/jupyterlab-dat/lib/fragments';

export class DatChat extends VDomRenderer<DatChatModel> {
  constructor(options: DatChatModel.IOptions) {
    super();
    this.model = new DatChatModel(options);
    this.title.icon = CSS.DAT.ICON_NAMES.chat;
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

    this.title.dataset = {
      'dat-status': m.notebookUrls.length
        ? CSS.DAT.STATUS.subscribed
        : CSS.DAT.STATUS.offline
    };

    const options = urls.map((url, idx) => {
      let info = infos[url];
      let label = url;
      let peers = '?';
      let author = 'Unknown';
      if (info) {
        label = info.title || label;
        peers = `${info.peers == null ? peers : info.peers}`;
        author = !info.author
          ? author
          : typeof info.author === 'string'
          ? author
          : (author as any).name;
      }
      const checked = url === nextUrl;

      let datTypes = m.datTypes(url).map((datType, key) => {
        return (
          <i key={key} title={datType.label}>
            {m.icons.iconReact({ name: datType.icon, tag: 'span' })}
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
            <i>{datTypes}</i>
            <strong>
              {label}
              <br />
              {m.icons.iconReact({
                name: CSS.DAT.ICON_NAMES.happy,
                tag: 'span'
              })}
              {author}
            </strong>
            <i title={`${peers} peer${peers !== '1'} connected`}>
              {m.icons.iconReact({
                name: CSS.DAT.ICON_NAMES.network,
                tag: 'span'
              })}
              {peers}
            </i>
          </label>
        </li>
      );
    });

    const nullState = <blockquote>No dats to chat about... yet.</blockquote>;

    return (
      <div className={`${CSS.WIDGET}-Main ${CSS.DAT.PANEL}`}>
        <section>
          <p>
            <label>dat chats</label>
          </p>
          <ul className={`${CSS.WIDGET}-Urls`}>
            {options.length ? options : nullState}
          </ul>
        </section>
        <footer>
          <p>
            <label>dat link</label>
            {renderDatURL({
              url: m.nextUrl,
              props: {
                onChange: this.onUrlChange
              }
            })}
            <small>
              <i>Paste a dat link to chat</i>
            </small>
          </p>
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
        </footer>
      </div>
    );
  }
}
