import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { IDatManager } from '@deathbeds/jupyterlab-dat/lib/tokens';

import { CSS } from '.';
import { IDatIdentityManager, ID } from './tokens';
import { DatIdentityManager } from './manager';
import { DatMe } from './me';

const extension: JupyterFrontEndPlugin<IDatIdentityManager> = {
  id: ID,
  autoStart: true,
  provides: IDatIdentityManager,
  requires: [IDatManager],
  activate: async (_app: JupyterFrontEnd, dat: IDatManager) => {
    const manager = new DatIdentityManager({
      datManager: dat
    });

    const me = new DatMe();
    me.title.label = 'my dat';
    me.title.icon = CSS.DAT.ICON_NAMES.happy;

    dat.addSidebarItem(me, { rank: 0 });
    me.model = await manager.getModel();

    return manager;
  }
};

export default extension;
