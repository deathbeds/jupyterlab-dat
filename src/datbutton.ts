import { IDisposable, DisposableDelegate } from '@phosphor/disposable';

import { Widget } from '@phosphor/widgets';

import { ISignal, Signal } from '@phosphor/signaling';

import { ToolbarButton } from '@jupyterlab/apputils';

import { DocumentRegistry } from '@jupyterlab/docregistry';

import { NotebookPanel, INotebookModel } from '@jupyterlab/notebook';

import { DatManager } from './manager';

const ICON_CLASS = 'jp-DatContents-Icon';

export class DatURL extends Widget {
  constructor() {
    const node = document.createElement('input');
    node.placeholder = 'dat://';
    super({node});
  }
}

export class DatNotebookButton
  implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel> {
  readonly widgetRequested: ISignal<any, void> = new Signal<any, void>(this);

  private _manager: DatManager;

  constructor(manager: DatManager) {
    this._manager = manager;
  }

  createNew(
    panel: NotebookPanel,
    context: DocumentRegistry.IContext<INotebookModel>
  ): IDisposable {
    let text = new DatURL();

    let button = new ToolbarButton({
      iconClassName: ICON_CLASS + ' jp-Icon jp-Icon-16',
      onClick: async () => {
        const node = text.node as HTMLInputElement;
        const datUrl = node.value;
        if(!datUrl) {
          const title = context.path.split('/').slice(-1)[0];
          const dat = await this._manager.create({ title });
          const onChange = () => {
            dat.writeFile(`${context.model.toJSON()}`, `/Untitled.ipynb`, 'utf-8');
          }
          context.model.contentChanged.connect(onChange);
          onChange();
          node.value = dat.url;
        } else {
          const dat = await this._manager.listen(datUrl);
          const watcher = dat.watch();
          watcher.on('changed', async (evt) => {
            console.log(evt);
            const content = await dat.readFile<string>('/Untitled.ipynb', 'utf-8');
            context.model.fromJSON(JSON.parse(content));
          });
        }
      },
      tooltip: 'Activate Notebook Sync'
    });

    panel.toolbar.insertItem(9, 'dat', button);
    panel.toolbar.insertItem(9, 'dat-url', text);

    return new DisposableDelegate(() => {
      button.dispose();
    });
  }
}
