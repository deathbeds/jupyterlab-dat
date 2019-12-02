import { Widget } from '@phosphor/widgets';
import { CSS } from '.';
import { IDatManager } from './tokens';
import { Accordion, Collapse } from './accordion';

const DEBUG = false;

export class DatBar extends Accordion {
  constructor(options: DatBar.IOptions) {
    super(options);
    this.addClass(CSS.SIDEBAR);
    this._datManager.sidebarItemsChanged.connect(this.onSidebarItems, this);
    this.onSidebarItems();
  }

  onSidebarItems() {
    let seen = [] as Widget[];
    let children = (this.widgets as Collapse[]).map(child => child.widget);
    for (let [item, _opts] of this._datManager.sidebarItems) {
      seen.push(item);
      if (!children.includes(item)) {
        this.addWidget(item);
      }
      if (DEBUG) {
        console.log(_opts);
      }
    }
    for (const child of children) {
      if (!seen.includes(child)) {
        this.removeWidget(child);
      }
    }
  }
}

export namespace DatBar {
  export interface IOptions {
    datManager: IDatManager;
  }
}
