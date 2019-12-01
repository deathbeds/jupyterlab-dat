import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
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

    const chat = new Chatbook({ serviceManager, identityManager });
    chat.id = CSS_ID;
    shell.add(chat, 'right');
    chat.node.addEventListener('mouseover', () => {
      app.shell.activateById(CSS_ID);
    });

    identityManager.datManager.datsChanged.connect(async () => {
      if (!chat.ready) {
        await chat.createWidget();
      }
    });

    identityManager.datManager.registerExtension(
      ID,
      (archive, _name, message, peer) => {
        chat.addMessage(archive.url, message, peer);
      }
    );
  }
};

export default extension;
