import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { IDatManager } from '@deathbeds/jupyterlab-dat/lib/tokens';

import { ID } from './tokens';
import { IDatIdentityManager } from './tokens';
import { DatIdentityManager } from './manager';
import { DatMe } from './me';

const extension: JupyterFrontEndPlugin<IDatIdentityManager> = {
  id: ID,
  autoStart: true,
  provides: IDatIdentityManager,
  requires: [IDatManager],
  activate: async (app: JupyterFrontEnd, dat: IDatManager) => {
    const manager = new DatIdentityManager({
      datManager: dat
    });

    const main = new DatMe();
    main.id = 'id-dat-identity-me';
    main.model = await manager.getModel();

    app.shell.add(main, 'right');

    return manager;
  }
};

export default extension;
