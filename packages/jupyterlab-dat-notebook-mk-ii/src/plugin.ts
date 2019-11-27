import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  JupyterLab,
  IRouter
} from '@jupyterlab/application';

import { URLExt } from '@jupyterlab/coreutils';

import { MainAreaWidget } from '@jupyterlab/apputils';

import { NotebookPanel } from '@jupyterlab/notebook';

import { IDatManager } from '@deathbeds/jupyterlab-dat/lib/tokens';

import { DatNotebookButton } from './datbutton';

import { DatWidget } from './datwidget';

const extension: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-dat-notebook-mk-ii',
  autoStart: true,
  requires: [JupyterFrontEnd.IPaths, IRouter, IDatManager],
  activate: (
    app: JupyterFrontEnd,
    paths: JupyterFrontEnd.IPaths,
    router: IRouter,
    dat: IDatManager
  ) => {
    const { shell, commands } = app;
    const datButton = new DatNotebookButton(dat);

    function addMainAreaWidget(content: DatWidget) {
      const main = new MainAreaWidget({ content });
      shell.add(main, 'main', {
        mode: 'split-bottom',
        ref: content.model.panel.id
      });
      content.model.panel.disposed.connect(main.dispose, main);
    }

    datButton.widgetRequested.connect((_it, content) => {
      addMainAreaWidget(content as DatWidget);
    });

    [datButton].forEach(button => {
      app.docRegistry.addWidgetExtension('Notebook', button);
    });

    const datPattern = new RegExp(
      `^${paths.urls.tree}/dat-mkii/([0-9a-f]{64})`
    );

    commands.addCommand(CommandIDs.openDatNotebook, {
      execute: async (args: any) => {
        const loc = args as IRouter.ILocation;
        const datMatch = loc.path.match(datPattern);
        if (datMatch) {
          const datKey = datMatch[1];
          const nb: NotebookPanel = await commands.execute(
            'notebook:create-new',
            { kernelName: 'python3' }
          );
          const url = URLExt.join(paths.urls.tree, nb.context.path);
          router.navigate(url);
          const datWidget = await datButton.requestWidget(nb, false);
          datWidget.model.loadUrl = `dat://${datKey}`;
          await datWidget.model.onSubscribe();
          addMainAreaWidget(datWidget);
          const lab = app as JupyterLab;
          lab.shell.presentationMode = true;
          lab.shell.mode = 'single-document';
          lab.shell.collapseLeft();
          lab.shell.collapseRight();
          lab.shell.activateById(nb.id);
          setTimeout(() => {
            lab.shell.activateById(nb.id);
          }, 100);
          return router.stop;
        }
      }
    });

    router.register({
      command: CommandIDs.openDatNotebook,
      pattern: datPattern,
      rank: 29
    });
  }
};

namespace CommandIDs {
  export const openDatNotebook: string = 'dat:notebook';
}

export default extension;
