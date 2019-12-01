import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  JupyterLab
} from '@jupyterlab/application';

import { IDatIdentityManager } from '@deathbeds/jupyterlab-dat-identity/lib/tokens';

import { Chatbook } from './chatbook';

import { ID, CSS, DAT_CHAT } from '.';
import { DatChatManager } from './manager';

const extension: JupyterFrontEndPlugin<void> = {
  id: ID,
  autoStart: true,
  requires: [IDatIdentityManager],
  activate: (app: JupyterFrontEnd, identityManager: IDatIdentityManager) => {
    const { shell, serviceManager } = app;
    const manager = new DatChatManager({ serviceManager, identityManager });
    const { datManager } = identityManager;

    (app as JupyterLab).shell.activeChanged.connect((shel, change) => {
      manager.activeWidget = change.newValue;
    });

    const launcher = new Chatbook({ manager });
    launcher.title.label = 'dat chat';
    launcher.title.icon = CSS.DAT.ICON_NAMES.chat;

    manager.widgetRequested.connect((chatbook, panel) => {
      shell.add(panel, 'main', { mode: 'split-right' });
      (app as JupyterLab).shell.collapseRight();
    });

    datManager.registerExtension(ID, (archive, _name, message, peer) => {
      manager.addMessage({
        archiveUrl: archive.url,
        message,
        peer
      });
    });

    datManager.addSidebarItem(launcher, { rank: 1 });

    datManager.registerDatType(DAT_CHAT);
  }
};

export default extension;
