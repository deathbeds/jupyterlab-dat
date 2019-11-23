import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { DatManager } from './manager';

import { DatNotebookButton } from './datbutton';

const extension: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-ws-contents',
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
    const manager = new DatManager();

    const datButton = new DatNotebookButton(manager);
    console.log(datButton);

    [datButton].forEach(button => {
      app.docRegistry.addWidgetExtension('Notebook', button);
    });
  }
};

export default extension;
