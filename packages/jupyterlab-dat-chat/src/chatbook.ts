import { dat } from '@deathbeds/dat-sdk-webpack';
import { CommandRegistry } from '@phosphor/commands';
import { SplitPanel, SplitLayout, Widget } from '@phosphor/widgets';

import {
  NotebookPanel,
  NotebookActions,
  NotebookModelFactory,
  NotebookWidgetFactory
} from '@jupyterlab/notebook';

import { MarkdownCellModel, MarkdownCell } from '@jupyterlab/cells';

import { IIconRegistry } from '@jupyterlab/ui-components';

import { ServiceManager } from '@jupyterlab/services';

import { editorServices } from '@jupyterlab/codemirror';

import { DocumentManager } from '@jupyterlab/docmanager';

import { DocumentRegistry } from '@jupyterlab/docregistry';

import { IDatManager } from '@deathbeds/jupyterlab-dat/lib/tokens';

import { DatChat } from './widget';
import { setupCommands } from './commands';

import { CSS } from '.';

import {
  RenderMimeRegistry,
  standardRendererFactories as initialFactories
} from '@jupyterlab/rendermime';

// import { IDatManager } from '@deathbeds/jupyterlab-dat/lib/tokens';
// import { IIconRegistry } from '@jupyterlab/ui-components';

// import { ID } from '.';

export class Chatbook extends SplitPanel {
  private _serviceManager: ServiceManager;
  private _datManager: IDatManager;
  private _ready = false;
  private _datChat: DatChat;
  private _notebook: NotebookPanel;

  constructor(options: Chatbook.IOptions) {
    super();
    this._serviceManager = options.serviceManager;
    this._datManager = options.datManager;
    this.addClass(CSS.WIDGET);
    this.title.caption = 'Chatbook';
    this.title.iconClass = 'jp-DatHappyDatIcon';
    this._datChat = new DatChat({
      manager: this._datManager,
      icons: options.icons
    });
    SplitLayout.setStretch(this._datChat, 1);
    this.splitLayout.orientation = 'vertical';
    this.splitLayout.addWidget(this._datChat);
  }

  get splitLayout() {
    return this.layout as SplitLayout;
  }

  get ready() {
    return this._ready;
  }

  addMessage(_url: string, message: Buffer, peer?: dat.IHyperdrive.IPeer) {
    const modelJSON = JSON.parse(message.toString());
    const markdownModel = new MarkdownCellModel({});
    markdownModel.value.text = modelJSON.source;
    const idx = this._notebook.model.cells.length - 1;
    this._notebook.model.cells.insert(idx, markdownModel);
    const widget = this._notebook.content.widgets[idx] as MarkdownCell;
    widget.promptNode.textContent = 'wooo';
    console.log(peer);
  }

  async createWidget() {
    // Initialize the command registry with the bindings.
    let commands = new CommandRegistry();
    let useCapture = true;

    // Setup the keydown listener for the document.
    document.addEventListener(
      'keydown',
      event => {
        commands.processKeydownEvent(event);
      },
      useCapture
    );

    let docRegistry = new DocumentRegistry();
    let docManager = new DocumentManager({
      registry: docRegistry,
      manager: this._serviceManager,
      opener: {
        open: (_widget: Widget) => console.log('noop')
      }
    });
    let mFactory = new NotebookModelFactory({});
    let rendermime = new RenderMimeRegistry({
      initialFactories: initialFactories
    });
    let editorFactory = editorServices.factoryService.newInlineEditor;
    let contentFactory = new NotebookPanel.ContentFactory({ editorFactory });

    let wFactory = new NotebookWidgetFactory({
      name: 'Notebook',
      modelName: 'notebook',
      fileTypes: ['notebook'],
      defaultFor: ['notebook'],
      preferKernel: false,
      canStartKernel: false,
      rendermime,
      contentFactory,
      mimeTypeService: editorServices.mimeTypeService
    });
    docRegistry.addModelFactory(mFactory);
    docRegistry.addWidgetFactory(wFactory);

    // TODO: fix this
    const model = await docManager.newUntitled({ type: 'notebook' });
    this._notebook = docManager.open(model.path) as NotebookPanel;

    (this._notebook.layout as any).widgets[0].hide();

    NotebookActions.insertBelow(this._notebook.content);
    SplitLayout.setStretch(this._notebook, 3);
    this.splitLayout.addWidget(this._notebook);

    setupCommands(commands, this, this._notebook, this._datChat.model);

    this._ready = true;
  }
}

export namespace Chatbook {
  export interface IOptions {
    serviceManager: ServiceManager;
    datManager: IDatManager;
    icons: IIconRegistry;
  }
}
