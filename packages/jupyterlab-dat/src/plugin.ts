import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { MainAreaWidget } from '@jupyterlab/apputils';

import { DatManager } from './manager';

import { DatNotebookButton } from './datbutton';

const extension: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-ws-contents',
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
    const manager = new DatManager();
    const { shell } = app;
    const datButton = new DatNotebookButton(manager);

    datButton.widgetRequested.connect((_it, content) => {
      const main = new MainAreaWidget({ content });
      shell.add(main, 'main', { mode: 'split-right' });
    });

    [datButton].forEach(button => {
      app.docRegistry.addWidgetExtension('Notebook', button);
    });
  }
};

export default extension;
