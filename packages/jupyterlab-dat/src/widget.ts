import { Widget, TabPanel } from '@phosphor/widgets';
import { h } from '@phosphor/virtualdom';
import { CSS } from '.';
import { IDatManager } from './tokens';

const DEBUG = false;

export class DatBar extends TabPanel {
  private _datManager: IDatManager;
  constructor(options: DatBar.IOptions) {
    options.tabsMovable = false;
    options.tabPlacement = 'top';
    options.renderer = {
      renderTab: data => {
        const { title, current } = data;

        const svg = (this._datManager.icons as any).resolveSvg(title.icon);
        return h.li(
          { className: `p-TabBar-tab ${current ? CSS.JP.active : ''}` },
          [
            h.img({ src: `data:image/svg+xml;base64,${btoa(svg.outerHTML)}` }),
            h.label(title.label)
          ]
        );
      },
      closeIconSelector: '.not-gonna-find-it'
    };
    super(options);
    this._datManager = options.datManager;
    this.addClass(CSS.SIDEBAR);
    this._datManager.sidebarItemsChanged.connect(this.onSidebarItems, this);
    this.onSidebarItems();
  }

  onSidebarItems() {
    let seen = [] as Widget[];
    let children = this.widgets;
    for (let [item, _opts] of this._datManager.sidebarItems) {
      seen.push(item);
      if (!children.includes(item)) {
        this.addWidget(item);
      }
      if (DEBUG) {
        console.log(_opts);
      }
    }
  }
}

export namespace DatBar {
  export interface IOptions extends TabPanel.IOptions {
    datManager: IDatManager;
  }
}
