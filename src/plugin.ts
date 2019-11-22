import {
  JupyterFrontEnd, JupyterFrontEndPlugin
} from '@jupyterlab/application';


import {NotebookSyncButton} from './button';

/**
 * Initialization data for the jupyterlab-ws-contents extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-ws-contents',
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
    const syncButton = new NotebookSyncButton();
    app.docRegistry.addWidgetExtension('Notebook', syncButton);
  }
};

export default extension;
