import React from 'react';

import { VDomRenderer } from '@jupyterlab/apputils';

import { CSS } from '.';

import { DatChatModel } from './model';

export class DatChat extends VDomRenderer<DatChatModel> {
  constructor(options: DatChatModel.IOptions) {
    super();
    this.model = new DatChatModel(options);
    this.title.iconClass = CSS.DAT.ICONS.happy;
    this.addClass(`${CSS.WIDGET}-Main`);
    this.addClass('jp-RenderedHTMLCommon');
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

    const selectProps = {
      className: 'jp-mod-styled',
      onChange: (evt: React.ChangeEvent<HTMLSelectElement>) => {
        m.nextUrl = evt.currentTarget.value;
      }
    };

    return (
      <div className={`${CSS.WIDGET}-Main`}>
        <header>
          {m.icons.iconReact({ name: 'dat-happy-dat' })}
          <select {...selectProps}>{options}</select>
        </header>
      </div>
    );
  }
}
