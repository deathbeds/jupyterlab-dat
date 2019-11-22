import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from "@jupyterlab/application";

import { DatManager } from "./manager";

import { NotebookSyncButton } from "./button";
import { DatNotebookButton } from "./datbutton";

const extension: JupyterFrontEndPlugin<void> = {
  id: "jupyterlab-ws-contents",
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
    const manager = new DatManager();

    const syncButton = new NotebookSyncButton();
    const datButton = new DatNotebookButton(manager);

    [syncButton, datButton].forEach(button => {
      app.docRegistry.addWidgetExtension("Notebook", button);
    });
  }
};

export default extension;
