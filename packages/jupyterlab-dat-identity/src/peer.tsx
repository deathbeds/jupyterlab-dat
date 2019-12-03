import React from 'react';

import { Widget } from '@phosphor/widgets';

import { VDomRenderer } from '@jupyterlab/apputils';

import { DatIdentityModel } from './model';

import { CSS } from '.';

export class DatPeer extends VDomRenderer<DatIdentityModel> {
  constructor(options?: Widget.IOptions) {
    super(options);
    this.addClass(`${CSS.DAT.PEER}`);
  }

  protected render() {
    const m = this.model;

    if (!m) {
      return <div />;
    }

    const props = {
      className: m.peer ? CSS.DAT.OTHER : CSS.DAT.SELF
    };

    return (
      <label>
        <div {...props}>
          {m.icons.iconReact({ name: CSS.DAT.ICON_NAMES.happy })}
        </div>
        <span title={m.handle}>{m.handle}</span>
      </label>
    );
  }
}
