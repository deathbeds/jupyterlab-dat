import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  JupyterLab
} from '@jupyterlab/application';

import { IDatIdentityManager } from '@deathbeds/jupyterlab-dat-identity/lib/tokens';
import { IIconRegistry } from '@jupyterlab/ui-components';

import { Chatbook } from './chatbook';

import { ID } from '.';

const CSS_ID = 'id-jp-dat-chat';

const extension: JupyterFrontEndPlugin<void> = {
  id: ID,
  autoStart: true,
  requires: [IIconRegistry, IDatIdentityManager],
  activate: (
    app: JupyterFrontEnd,
    icons: IIconRegistry,
    identityManager: IDatIdentityManager
  ) => {
    const { shell, serviceManager } = app;

    const launcher = new Chatbook({ serviceManager, identityManager });
    launcher.id = CSS_ID;
    shell.add(launcher, 'right');
    launcher.node.addEventListener('mouseover', () => {
      app.shell.activateById(CSS_ID);
    });

    launcher.widgetRequested.connect((chatbook, panel) => {
      shell.add(panel, 'main', { mode: 'split-right' });
      (app as JupyterLab).shell.collapseRight();
    });

    identityManager.datManager.registerExtension(
      ID,
      (archive, _name, message, peer) => {
        launcher.addMessage(archive.url, message, peer);
      }
    );
  }
};

export default extension;
