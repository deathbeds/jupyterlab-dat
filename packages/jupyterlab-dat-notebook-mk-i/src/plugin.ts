import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { MainAreaWidget } from '@jupyterlab/apputils';

import { IDatManager } from '@deathbeds/jupyterlab-dat/lib/tokens';

import { DatNotebookButton } from './datbutton';

const extension: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-dat-notebook-mki-i',
  autoStart: true,
  requires: [IDatManager],
  activate: (app: JupyterFrontEnd, dat: IDatManager) => {
    const { shell } = app;
    const datButton = new DatNotebookButton(dat);

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
