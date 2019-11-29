import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { IDatManager } from '@deathbeds/jupyterlab-dat/lib/tokens';
import { IIconRegistry } from '@jupyterlab/ui-components';

import { ID } from '.';

import { DatChat } from './widget';

const extension: JupyterFrontEndPlugin<void> = {
  id: ID,
  autoStart: true,
  requires: [IIconRegistry, IDatManager],
  activate: (app: JupyterFrontEnd, icons: IIconRegistry, dat: IDatManager) => {
    const { shell } = app;

    const chat: DatChat = new DatChat({
      manager: dat,
      icons
    });

    chat.id = ID;

    dat.datsChanged.connect(() => shell.add(chat, 'right'));

    dat.registerExtension(ID, (archive, _name, message, peer) => {
      chat.model.addMessage(archive.url, message, peer);
    });
  }
};

export default extension;
