import { IDisposable, DisposableDelegate } from '@phosphor/disposable';

import { Widget } from '@phosphor/widgets';

import { Signal } from '@phosphor/signaling';

import { ToolbarButton } from '@jupyterlab/apputils';

import { DocumentRegistry } from '@jupyterlab/docregistry';

import { NotebookPanel, INotebookModel } from '@jupyterlab/notebook';

import { IDatIdentityManager } from '@deathbeds/jupyterlab-dat-identity/lib/tokens';

import { DatWidget } from './datwidget';

import { CSS } from '.';

export class DatNotebookButton
  implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel> {
  readonly widgetRequested: Signal<any, Widget> = new Signal<any, Widget>(this);

  private _identityManager: IDatIdentityManager;

  constructor(manager: IDatIdentityManager) {
    this._identityManager = manager;
  }

  async requestWidget(panel: NotebookPanel, emit = true) {
    const widget = new DatWidget({
      panel,
      context: panel.context,
      identityManager: this._identityManager
    });
    if (emit) {
      this.widgetRequested.emit(widget);
    }
    return widget;
  }

  createNew(
    panel: NotebookPanel,
    _context: DocumentRegistry.IContext<INotebookModel>
  ): IDisposable {
    let button = new ToolbarButton({
      iconClassName: `jp-Icon jp-Icon-16 ${CSS.ICONS.notebookPublish}`,
      onClick: async () => await this.requestWidget(panel),
      tooltip: 'Publish/Subscribe'
    });

    panel.toolbar.insertItem(2, 'dat-notebook', button);

    return new DisposableDelegate(() => {
      button.dispose();
    });
  }
}
