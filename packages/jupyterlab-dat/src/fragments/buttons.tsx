import React from 'react';
import { CSS } from '..';

import { IIconRegistry } from '@jupyterlab/ui-components';

const BTN_CLASS = `${CSS.JP.styled} ${CSS.BTN.big}`;

export function renderShield(options: buttons.IShieldOptions) {
  return (
    <div className={CSS.SHIELD}>
      {options.icons.iconReact({ name: options.icon })}
    </div>
  );
}

export function renderBigButton(options: buttons.IBigButtonOptions) {
  const className = `${BTN_CLASS} ${options.className || ''}`;
  return (
    <button {...options.props} className={className}>
      <label>{options.label}</label>
      {renderShield({ icon: options.icon, icons: options.icons })}
    </button>
  );
}

export namespace buttons {
  export interface IBigButtonOptions {
    label: string;
    icon: string;
    props: any;
    icons: IIconRegistry;
    className?: string;
  }
  export interface IShieldOptions {
    icon: string;
    icons: IIconRegistry;
  }
}
