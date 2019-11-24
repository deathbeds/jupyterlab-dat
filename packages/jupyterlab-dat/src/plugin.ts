import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { DatManager } from './manager';
import { IDatManager } from './tokens';

const extension: JupyterFrontEndPlugin<IDatManager> = {
  id: 'jupyterlab-ws-contents',
  autoStart: true,
  provides: IDatManager,
  activate: (_app: JupyterFrontEnd) => {
    const manager = new DatManager();
    return manager;
  }
};

export default extension;
