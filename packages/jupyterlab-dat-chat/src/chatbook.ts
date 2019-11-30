import { dat } from '@deathbeds/dat-sdk-webpack';
import { CommandRegistry } from '@phosphor/commands';
import { BoxPanel, BoxLayout, Widget } from '@phosphor/widgets';

import {
  NotebookPanel,
  NotebookActions,
  NotebookModelFactory,
  NotebookWidgetFactory
} from '@jupyterlab/notebook';

import {
  MarkdownCellModel,
  MarkdownCell,
  isMarkdownCellModel
} from '@jupyterlab/cells';

import { ServiceManager } from '@jupyterlab/services';

import { editorServices } from '@jupyterlab/codemirror';

import { DocumentManager } from '@jupyterlab/docmanager';

import { DocumentRegistry } from '@jupyterlab/docregistry';

import { IDatIdentityManager } from '@deathbeds/jupyterlab-dat-identity/lib/tokens';

import { DatPeer } from '@deathbeds/jupyterlab-dat-identity/lib/peer';

import { DatChat } from './widget';
import { setupCommands } from './commands';

import { ID, CSS } from '.';

import {
  RenderMimeRegistry,
  standardRendererFactories as initialFactories
} from '@jupyterlab/rendermime';
import { nbformat } from '@jupyterlab/coreutils';

export class Chatbook extends BoxPanel {
  private _serviceManager: ServiceManager;
  private _identityManager: IDatIdentityManager;
  private _ready = false;
  private _datChat: DatChat;
  private _notebook: NotebookPanel;

  constructor(options: Chatbook.IOptions) {
    super();
    this._serviceManager = options.serviceManager;
    this._identityManager = options.identityManager;
    this.addClass(CSS.WIDGET);
    this.title.caption = 'Chatbook';
    this.title.iconClass = CSS.DAT.ICONS.chat;
    this._datChat = new DatChat({
      manager: this._identityManager
    });
    this.boxLayout.direction = 'top-to-bottom';
    this.boxLayout.addWidget(this._datChat);
  }

  get boxLayout() {
    return this.layout as BoxLayout;
  }

  get ready() {
    return this._ready;
  }

  async addMessage(
    _url: string,
    message: Buffer,
    peer?: dat.IHyperdrive.IPeer
  ) {
    const modelJSON = JSON.parse(message.toString()) as nbformat.IMarkdownCell;
    const markdownModel = new MarkdownCellModel({});
    markdownModel.value.text = Array.isArray(modelJSON.source)
      ? modelJSON.source.join('')
      : modelJSON.source;
    const idx = this._notebook.model.cells.length - 1;
    this._notebook.model.cells.insert(idx, markdownModel);
    const widget = this._notebook.content.widgets[idx] as MarkdownCell;
    const peerNode = document.createElement('div');
    widget.promptNode.appendChild(peerNode);
    widget.addClass(peer ? CSS.DAT.OTHER : CSS.DAT.SELF);
    const peerIcon = new DatPeer({ node: peerNode });

    peerIcon.model = await this._identityManager.getModel(peer);

    peerIcon.model.handle = (modelJSON.metadata[ID] as any)['handle'];
    peerIcon.model.peer = peer;
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
    this.boxLayout.addWidget(this._notebook);

    this._notebook.content.activeCellChanged.connect(() => {
      const { widgets } = this._notebook.content;
      const lastIndex = widgets.length - 1;
      widgets.forEach((cell, i) => {
        if (isMarkdownCellModel(cell.model) && i !== lastIndex) {
          const markdownCell = cell as MarkdownCell;
          markdownCell.rendered = true;
        }
      });
    });

    setupCommands(commands, this, this._notebook, this._datChat.model);

    this._ready = true;
  }
}

export namespace Chatbook {
  export interface IOptions {
    serviceManager: ServiceManager;
    identityManager: IDatIdentityManager;
  }
}
