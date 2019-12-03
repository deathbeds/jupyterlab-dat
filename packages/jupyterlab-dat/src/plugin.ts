import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { IIconRegistry } from '@jupyterlab/ui-components';

import { DatManager } from './manager';
import { IDatManager } from './tokens';
import { ICONS } from './icons';
import { DatBar } from './widget';
import { CSS } from '.';

const extension: JupyterFrontEndPlugin<IDatManager> = {
  id: 'jupyterlab-dat',
  autoStart: true,
  provides: IDatManager,
  requires: [IIconRegistry],
  activate: (app: JupyterFrontEnd, icons: IIconRegistry) => {
    icons.addIcon(...ICONS);
    const manager = new DatManager({ icons });
    const bar = new DatBar({ datManager: manager });
    bar.id = 'id-dat-sidebar';
    bar.title.caption = 'dat';
    bar.title.icon = CSS.ICON_NAMES.outlines;
    app.shell.add(bar, 'left');
    return manager;
  }
};

export default extension;
