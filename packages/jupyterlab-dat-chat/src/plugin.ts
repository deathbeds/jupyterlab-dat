import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { IDatManager } from '@deathbeds/jupyterlab-dat/lib/tokens';
import { IIconRegistry } from '@jupyterlab/ui-components';

import { Chatbook } from './chatbook';

import { ID } from '.';

const extension: JupyterFrontEndPlugin<void> = {
  id: ID,
  autoStart: true,
  requires: [IIconRegistry, IDatManager],
  activate: (
    app: JupyterFrontEnd,
    icons: IIconRegistry,
    datManager: IDatManager
  ) => {
    const { shell, serviceManager } = app;

    const chat = new Chatbook({ serviceManager, datManager, icons });
    chat.id = ID;
    shell.add(chat, 'right');

    datManager.datsChanged.connect(async () => {
      if (!chat.ready) {
        await chat.createWidget();
      }
    });

    datManager.registerExtension(ID, (archive, _name, message, peer) => {
      chat.addMessage(archive.url, message, peer);
    });
  }
};

export default extension;
