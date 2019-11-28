import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { IIconRegistry } from '@jupyterlab/ui-components';

import { DatManager } from './manager';
import { IDatManager } from './tokens';

const extension: JupyterFrontEndPlugin<IDatManager> = {
  id: 'jupyterlab-dat',
  autoStart: true,
  provides: IDatManager,
  requires: [IIconRegistry],
  activate: (_app: JupyterFrontEnd, icons: IIconRegistry) => {
    import('./icons')
      .then(datIcons => icons.addIcon(...datIcons.ICONS))
      .catch(console.warn);

    const manager = new DatManager();
    return manager;
  }
};

export default extension;
