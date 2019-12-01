import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  JupyterLab
} from '@jupyterlab/application';

import { IDatIdentityManager } from '@deathbeds/jupyterlab-dat-identity/lib/tokens';

import { Chatbook } from './chatbook';

import { ID, CSS } from '.';
import { DatChatManager } from './manager';

const extension: JupyterFrontEndPlugin<void> = {
  id: ID,
  autoStart: true,
  requires: [IDatIdentityManager],
  activate: (app: JupyterFrontEnd, identityManager: IDatIdentityManager) => {
    const { shell, serviceManager } = app;
    const manager = new DatChatManager({ serviceManager, identityManager });

    const launcher = new Chatbook({ manager });
    launcher.title.label = 'dat chat';
    launcher.title.icon = CSS.DAT.ICON_NAMES.chat;

    manager.widgetRequested.connect((chatbook, panel) => {
      shell.add(panel, 'main', { mode: 'split-right' });
      (app as JupyterLab).shell.collapseRight();
    });

    identityManager.datManager.registerExtension(
      ID,
      (archive, _name, message, peer) => {
        manager.addMessage({
          archiveUrl: archive.url,
          message,
          peer
        });
      }
    );

    identityManager.datManager.addSidebarItem(launcher, { rank: 1 });
  }
};

export default extension;
