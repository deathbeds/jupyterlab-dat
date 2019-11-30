const PLACEHOLDER = 'dat://';

import React from 'react';
import { CSS } from '..';

const handleFocus = (event: React.FocusEvent<HTMLInputElement>) =>
  event.target.select();

export function renderDatURL(options: inputs.IDatURLOptions) {
  return (
    <input
      defaultValue={options.url}
      className={CSS.JP.styled}
      onFocus={handleFocus}
      placeholder={PLACEHOLDER}
      {...options.props}
    />
  );
}

export namespace inputs {
  export interface IDatURLOptions {
    url: string;
    props: any;
  }
}
