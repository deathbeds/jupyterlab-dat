import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

// import { MainAreaWidget } from '@jupyterlab/apputils';

import { IDatManager } from '@deathbeds/jupyterlab-dat/lib/tokens';
import { IIconRegistry } from '@jupyterlab/ui-components';

import { ID } from './tokens';
import { IDatIdentityManager } from './tokens';
import { DatIdentityManager } from './manager';

const extension: JupyterFrontEndPlugin<IDatIdentityManager> = {
  id: ID,
  autoStart: true,
  provides: IDatIdentityManager,
  requires: [IIconRegistry, IDatManager],
  activate: (app: JupyterFrontEnd, icons: IIconRegistry, dat: IDatManager) => {
    console.log(app, icons, dat);
    const manager = new DatIdentityManager({
      datManager: dat
    });
    return manager;
  }
};

export default extension;
