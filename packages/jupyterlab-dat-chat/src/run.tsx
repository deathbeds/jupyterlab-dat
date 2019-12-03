import React from 'react';
import { Widget } from '@phosphor/widgets';
import { VDomRenderer, VDomModel } from '@jupyterlab/apputils';

import { IMarkdownCellModel } from '@jupyterlab/cells';

import { CSS } from '.';

export class RunButton extends VDomRenderer<RunButton.Model> {
  constructor(options: RunButton.IOptions) {
    super(options);
    this.model = new RunButton.Model(options);
    this.addClass(CSS.RUN);
  }

  protected render() {
    const m = this.model;
    return (
      <button
        className={`${CSS.DAT.JP.styled} ${
          m.canClick ? CSS.DAT.JP.accept : ''
        }`}
        onClick={this.onClick}
        disabled={!m.canClick}
      >
        SAY
      </button>
    );
  }

  onClick = () => this.model.onClick();
}

export namespace RunButton {
  export interface IOptions extends Widget.IOptions {
    onClick: Function;
    cell: IMarkdownCellModel;
  }
  export class Model extends VDomModel {
    _onClick: Function;
    _cell: IMarkdownCellModel;

    constructor(options: IOptions) {
      super();
      this._onClick = options.onClick;
      this._cell = options.cell;
      this._cell.value.changed.connect(() => this.stateChanged.emit(void 0));
    }

    get onClick() {
      return this._onClick;
    }
    get canClick() {
      return !!this._cell.value.text;
    }
    get cell() {
      return this._cell;
    }
  }
}
