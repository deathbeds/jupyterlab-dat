import { IDisposable, DisposableDelegate } from '@phosphor/disposable';

import { Widget } from '@phosphor/widgets';

import { Signal } from '@phosphor/signaling';

import { ToolbarButton } from '@jupyterlab/apputils';

import { DocumentRegistry } from '@jupyterlab/docregistry';

import { NotebookPanel, INotebookModel } from '@jupyterlab/notebook';

import { DatManager } from './manager';
import { DatWidget } from './datwidget';

import { ICON_CLASS } from '.';

export class DatNotebookButton
  implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel> {
  readonly widgetRequested: Signal<any, Widget> = new Signal<any, Widget>(this);

  private _manager: DatManager;

  constructor(manager: DatManager) {
    this._manager = manager;
  }

  createNew(
    panel: NotebookPanel,
    context: DocumentRegistry.IContext<INotebookModel>
  ): IDisposable {
    let button = new ToolbarButton({
      iconClassName: ICON_CLASS + ' jp-Icon jp-Icon-16',
      onClick: async () => {
        const widget = new DatWidget({
          panel,
          context,
          manager: this._manager
        });
        this.widgetRequested.emit(widget);
      },
      tooltip: 'Activate Notebook Sync'
    });

    panel.toolbar.insertItem(9, 'dat', button);

    return new DisposableDelegate(() => {
      button.dispose();
    });
  }
}
