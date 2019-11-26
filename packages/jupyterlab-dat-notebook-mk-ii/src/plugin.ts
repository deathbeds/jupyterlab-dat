import { Widget } from '@phosphor/widgets';
import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  IRouter
} from '@jupyterlab/application';

import { URLExt } from '@jupyterlab/coreutils';

import { MainAreaWidget } from '@jupyterlab/apputils';

import { NotebookPanel } from '@jupyterlab/notebook';

import { IDatManager } from '@deathbeds/jupyterlab-dat/lib/tokens';

import { DatNotebookButton } from './datbutton';

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

    function addMainAreaWidget(content: Widget) {
      const main = new MainAreaWidget({ content });
      shell.add(main, 'main', { mode: 'split-bottom' });
    }

    datButton.widgetRequested.connect((_it, content) => {
      addMainAreaWidget(content);
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
          const datWidget = await datButton.requestWidget(nb);
          datWidget.model.loadUrl = `dat://${datKey}`;
          await datWidget.model.onSubscribe();
          addMainAreaWidget(datWidget);
          return router.stop;
        }
      }
    });

    console.log('dat pattern', datPattern);
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
