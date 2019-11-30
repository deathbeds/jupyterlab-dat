import React from 'react';

import { Widget } from '@phosphor/widgets';

import { VDomRenderer } from '@jupyterlab/apputils';

import { DatIdentityModel } from './model';

import { CSS } from '.';

export class DatMe extends VDomRenderer<DatIdentityModel> {
  constructor(options?: Widget.IOptions) {
    super(options);
    this.title.caption = 'my dat';
    this.title.iconClass = CSS.DAT.ICONS.happy;
    this.addClass(CSS.ME);
  }

  protected render() {
    const m = this.model;

    if (!m) {
      return <div />;
    }

    return (
      <label>
        <div>{m.icons.iconReact({ name: 'dat-happy-dat' })}</div>
        <span title={m.handle}>{m.handle}</span>
      </label>
    );
  }
}
