import { IDisposable, DisposableDelegate } from '@phosphor/disposable';

import { Widget } from '@phosphor/widgets';

import { Signal } from '@phosphor/signaling';

import { ToolbarButton } from '@jupyterlab/apputils';

import { DocumentRegistry } from '@jupyterlab/docregistry';

import { NotebookPanel, INotebookModel } from '@jupyterlab/notebook';

import { IDatManager } from '@deathbeds/jupyterlab-dat/lib/tokens';

import { DatWidget } from './datwidget';

import { CSS } from '.';

export class DatNotebookButton
  implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel> {
  readonly widgetRequested: Signal<any, Widget> = new Signal<any, Widget>(this);

  private _manager: IDatManager;

  constructor(manager: IDatManager) {
    this._manager = manager;
  }

  createNew(
    panel: NotebookPanel,
    context: DocumentRegistry.IContext<INotebookModel>
  ): IDisposable {
    let button = new ToolbarButton({
      iconClassName: `jp-Icon jp-Icon-16 ${CSS.ICON}`,
      onClick: async () => {
        const widget = new DatWidget({
          panel,
          context,
          manager: this._manager
        });
        this.widgetRequested.emit(widget);
      },
      tooltip: 'Publish/Subscribe (mk i)'
    });

    panel.toolbar.insertItem(1, 'dat-mk-i', button);

    return new DisposableDelegate(() => {
      button.dispose();
    });
  }
}
