import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { IDatManager } from '@deathbeds/jupyterlab-dat/lib/tokens';

import { CSS, DAT_IDENTITY } from '.';
import { IDatIdentityManager, ID } from './tokens';
import { DatIdentityManager } from './manager';
import { DatMe } from './me';

const extension: JupyterFrontEndPlugin<IDatIdentityManager> = {
  id: ID,
  autoStart: true,
  provides: IDatIdentityManager,
  requires: [IDatManager],
  activate: async (_app: JupyterFrontEnd, datManager: IDatManager) => {
    const manager = new DatIdentityManager({
      datManager
    });

    const me = new DatMe();
    me.title.label = 'my dat';
    me.title.icon = CSS.DAT.ICON_NAMES.happy;

    datManager.addSidebarItem(me, { rank: 0 });

    datManager.registerDatType(DAT_IDENTITY);

    me.model = await manager.getModel();

    return manager;
  }
};

export default extension;
