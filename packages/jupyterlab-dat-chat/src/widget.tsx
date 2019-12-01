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
    this.addClass(`${CSS.WIDGET}-Main`);
    this.addClass('jp-RenderedHTMLCommon');
  }

  onUrlChange = (evt: React.ChangeEvent<HTMLSelectElement>) => {
    this.model.nextUrl = evt.currentTarget.value;
  };

  onHandleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    this.model.handle = evt.currentTarget.value;
  };

  onChatClicked = () => {
    this.model.requestChat();
  };

  protected render() {
    const m = this.model;
    const { infos, urls, handle } = m;

    const options = urls.map((url, idx) => {
      const onClick = () => (m.nextUrl = url);
      let info = infos[url];
      let label = url;
      if (info) {
        label = `${info.type || 'unknown'}: ${info.title || 'Untitled'}`;
      }
      return (
        <option key={idx} value={url} onClick={onClick}>
          {label}
        </option>
      );
    });

    const selectProps = {
      className: 'jp-mod-styled',
      onChange: this.onUrlChange
    };

    const inputProps = {
      className: 'jp-mod-styled',
      defaultValue: handle,
      onChange: this.onHandleChange
    };

    return (
      <div className={`${CSS.WIDGET}-Main`}>
        <header>
          {m.icons.iconReact({ name: 'dat-hexagon-outlines' })}
          <select {...selectProps}>{options}</select>
        </header>
        <header>
          {m.icons.iconReact({ name: 'dat-hexagon-chat' })}
          <input {...inputProps} />
        </header>
        {renderBigButton({
          label: 'CHAT',
          icon: 'dat-hexagon-chat',
          icons: m.icons,
          className: urls.length ? CSS.DAT.JP.accept : '',
          props: {
            disabled: !urls.length,
            onClick: this.onChatClicked
          }
        })}
      </div>
    );
  }
}
