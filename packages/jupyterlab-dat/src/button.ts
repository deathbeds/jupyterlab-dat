import { IDisposable, DisposableDelegate } from "@phosphor/disposable";

import { ISignal, Signal } from "@phosphor/signaling";

import { each } from "@phosphor/algorithm";

import { ToolbarButton } from "@jupyterlab/apputils";

import { PageConfig, URLExt } from "@jupyterlab/coreutils";

import { DocumentRegistry } from "@jupyterlab/docregistry";

import { NotebookPanel, INotebookModel } from "@jupyterlab/notebook";

const ICON_CLASS = "jp-WSContents-Icon";

/**
 * A notebook widget extension that adds a button to the toolbar.
 */
export class NotebookSyncButton
  implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel> {
  readonly widgetRequested: ISignal<any, void> = new Signal<any, void>(this);
  /**
   * Create a new extension object.
   */
  createNew(
    panel: NotebookPanel,
    context: DocumentRegistry.IContext<INotebookModel>
  ): IDisposable {
    let sock: WebSocket;
    let button = new ToolbarButton({
      iconClassName: ICON_CLASS + " jp-Icon jp-Icon-16",
      onClick: () => {
        const url = URLExt.join(
          PageConfig.getBaseUrl().replace(/^http/, "ws"),
          "api",
          "wscontents",
          context.path
        );

        if (sock) {
          sock.close();
          sock = null;
          return;
        }
        sock = new WebSocket(url);
        sock.onopen = evt => {
          console.log("open", evt);
        };
        sock.onmessage = evt => {
          console.log("received", new Date());
          const data = JSON.parse(evt.data);
          const { content, cell } = data;
          if (content) {
            each(panel.model.cells, (cell, i) => {
              const newSource = content.cells[i].source.join("");
              if (cell.value.text != newSource) {
                cell.value.text = newSource;
              }
            });
          } else if (cell) {
            panel.model.cells.get(cell.index).value.text = cell.source;
          }
        };
        panel.model.contentChanged.connect(() => {
          sock.send(
            JSON.stringify({
              cell: {
                index: panel.content.activeCellIndex,
                source: panel.content.activeCell.model.value.text
              }
            })
          );
        });
      },
      tooltip: "Activate Notebook Sync"
    });

    panel.toolbar.insertItem(9, "ws-sync", button);

    return new DisposableDelegate(() => {
      button.dispose();
    });
  }
}
