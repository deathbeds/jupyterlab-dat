import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { IIconRegistry } from '@jupyterlab/ui-components';

import { DatManager } from './manager';
import { IDatManager } from './tokens';
import { ICONS } from './icons';

const extension: JupyterFrontEndPlugin<IDatManager> = {
  id: 'jupyterlab-dat',
  autoStart: true,
  provides: IDatManager,
  requires: [IIconRegistry],
  activate: (_app: JupyterFrontEnd, icons: IIconRegistry) => {
    icons.addIcon(...ICONS);
    const manager = new DatManager();
    return manager;
  }
};

export default extension;
