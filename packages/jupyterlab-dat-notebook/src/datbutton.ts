import { IDisposable, DisposableDelegate } from '@phosphor/disposable';

import { Widget } from '@phosphor/widgets';

import { Signal } from '@phosphor/signaling';

import { ToolbarButton } from '@jupyterlab/apputils';

import { DocumentRegistry } from '@jupyterlab/docregistry';

import { NotebookPanel, INotebookModel } from '@jupyterlab/notebook';
import { IIconRegistry } from '@jupyterlab/ui-components';

import { IDatManager } from '@deathbeds/jupyterlab-dat/lib/tokens';

import { DatWidget } from './datwidget';

import { CSS } from '.';

export class DatNotebookButton
  implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel> {
  readonly widgetRequested: Signal<any, Widget> = new Signal<any, Widget>(this);

  private _manager: IDatManager;
  private _icons: IIconRegistry;

  constructor(manager: IDatManager, icons: IIconRegistry) {
    this._manager = manager;
    this._icons = icons;
  }

  async requestWidget(panel: NotebookPanel, emit = true) {
    const widget = new DatWidget({
      panel,
      context: panel.context,
      manager: this._manager,
      icons: this._icons
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
