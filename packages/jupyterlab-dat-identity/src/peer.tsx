import React from 'react';

import { Widget } from '@phosphor/widgets';

import { VDomRenderer } from '@jupyterlab/apputils';

import { DatIdentityModel } from './model';

import { CSS } from '.';

export class DatPeer extends VDomRenderer<DatIdentityModel> {
  constructor(options?: Widget.IOptions) {
    super(options);
    this.addClass(`${CSS.PEER}`);
  }

  protected render() {
    const m = this.model;

    if (!m) {
      return <div />;
    }

    const props = {
      className: m.peer ? CSS.OTHER : CSS.SELF
    };

    return (
      <label>
        <div {...props}>{m.icons.iconReact({ name: 'dat-hexagon-chat' })}</div>
        <span title={m.handle}>{m.handle}</span>
      </label>
    );
  }
}
