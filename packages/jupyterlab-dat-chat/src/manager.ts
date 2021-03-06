import { CommandRegistry } from '@phosphor/commands';
import { Signal, ISignal } from '@phosphor/signaling';
import { Widget } from '@phosphor/widgets';

import {
  NotebookPanel,
  NotebookActions,
  NotebookModelFactory,
  NotebookWidgetFactory
} from '@jupyterlab/notebook';

import {
  MarkdownCellModel,
  MarkdownCell,
  isMarkdownCellModel,
  IMarkdownCellModel
} from '@jupyterlab/cells';

import { PageConfig } from '@jupyterlab/coreutils';

import { ServiceManager } from '@jupyterlab/services';

import { editorServices } from '@jupyterlab/codemirror';

import { DocumentManager } from '@jupyterlab/docmanager';

import { DocumentRegistry } from '@jupyterlab/docregistry';

import { MathJaxTypesetter } from '@jupyterlab/mathjax2';

import { IDatIdentityManager } from '@deathbeds/jupyterlab-dat-identity/lib/tokens';

import { DatPeer } from '@deathbeds/jupyterlab-dat-identity/lib/peer';

import { setupCommands, CommandIDs } from './commands';
import { IDatChatManager } from './tokens';

import { ID, CSS } from '.';

import {
  RenderMimeRegistry,
  standardRendererFactories as initialFactories
} from '@jupyterlab/rendermime';
import { nbformat } from '@jupyterlab/coreutils';
import { RunButton } from './run';

export class DatChatManager implements IDatChatManager {
  private _serviceManager: ServiceManager;
  private _identityManager: IDatIdentityManager;
  private _widgetRequested = new Signal<IDatChatManager, NotebookPanel>(this);
  private _notebookUrls = new Map<string, Set<NotebookPanel>>();

  activeWidget: Widget;

  constructor(options: IDatChatManager.IOptions) {
    this._serviceManager = options.serviceManager;
    this._identityManager = options.identityManager;
  }

  get notebookUrls() {
    return Array.from(this._notebookUrls.keys());
  }

  get widgetRequested(): ISignal<IDatChatManager, NotebookPanel> {
    return this._widgetRequested;
  }

  get identityManager() {
    return this._identityManager;
  }

  async addMessage(context: IDatChatManager.IMessageContext) {
    if (context.notebook) {
      await this.addMessageToNotebook(context);
    } else {
      const notebooks = this._notebookUrls.get(context.archiveUrl);
      if (notebooks && notebooks.size) {
        const promises = [] as Promise<void>[];
        notebooks.forEach(notebook => {
          promises.push(this.addMessageToNotebook({ notebook, ...context }));
        });
        await Promise.all(promises);
      }
    }
  }

  async requestWidget(archiveUrl: string) {
    this._widgetRequested.emit(await this.createWidget(archiveUrl));
  }

  async addMessageToNotebook(context: IDatChatManager.IMessageContext) {
    const { message, peer, notebook } = context;
    const modelJSON = JSON.parse(message.toString()) as nbformat.IMarkdownCell;
    const markdownModel = new MarkdownCellModel({});
    markdownModel.value.text = Array.isArray(modelJSON.source)
      ? modelJSON.source.join('')
      : modelJSON.source;
    const idx = notebook.model.cells.length - 1;
    notebook.model.cells.insert(idx, markdownModel);
    const widget = notebook.content.widgets[idx] as MarkdownCell;
    const peerNode = document.createElement('div');
    widget.promptNode.appendChild(peerNode);
    widget.addClass(peer ? CSS.DAT.OTHER : CSS.DAT.SELF);
    const peerIcon = new DatPeer({ node: peerNode });

    peerIcon.model = await this._identityManager.getModel(peer);

    // TODO: replace with identity
    peerIcon.model.handle = (modelJSON.metadata[ID] as any)['handle'];
  }

  async createWidget(archiveUrl: string) {
    let commands = new CommandRegistry();
    let useCapture = true;

    let docRegistry = new DocumentRegistry();
    let docManager = new DocumentManager({
      registry: docRegistry,
      manager: this._serviceManager,
      opener: {
        open: (_widget: Widget) => {
          // nothing here yet
        }
      }
    });
    let mFactory = new NotebookModelFactory({});
    let rendermime = new RenderMimeRegistry({
      initialFactories: initialFactories,
      latexTypesetter: new MathJaxTypesetter({
        url: PageConfig.getOption('fullMathjaxUrl'),
        config: PageConfig.getOption('mathjaxConfig')
      })
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
    const notebook = docManager.open(model.path) as NotebookPanel;
    notebook.addClass(CSS.BOOK);
    notebook.title.icon = CSS.DAT.ICONS.chat;

    let info = await this._identityManager.datManager.getInfo(archiveUrl);

    if (info == null) {
      let archive = await this._identityManager.datManager.listen(archiveUrl, {
        sparse: true
      });
      console.warn('not sure what to do with this', archive);
      info = await this._identityManager.datManager.getInfo(archiveUrl);
    }

    if (!info) {
      return null;
    }

    notebook.title.label = `Chat: ${info.title || 'Untitled'}`;

    (notebook.layout as any).widgets[0].hide();

    NotebookActions.insertBelow(notebook.content);
    NotebookActions.changeCellType(notebook.content, 'markdown');

    notebook.content.activeCellChanged.connect(() => {
      const { widgets } = notebook.content;
      const lastIndex = widgets.length - 1;
      widgets.forEach((cell, i) => {
        if (isMarkdownCellModel(cell.model) && i !== lastIndex) {
          const markdownCell = cell as MarkdownCell;
          markdownCell.rendered = true;
        }
      });
    });

    document.addEventListener(
      'keydown',
      event => {
        if (this.activeWidget === notebook) {
          commands.processKeydownEvent(event);
        }
      },
      useCapture
    );

    setupCommands({ archiveUrl, notebook, commands, manager: this });

    if (!this._notebookUrls.has(archiveUrl)) {
      this._notebookUrls.set(archiveUrl, new Set());
    }
    this._notebookUrls.get(archiveUrl).add(notebook);

    this.addRunButton(notebook, commands);
    return notebook;
  }

  addRunButton(notebook: NotebookPanel, commands: CommandRegistry) {
    const runNode = document.createElement('div');
    let runButtonInterval = setInterval(() => {
      const { widgets } = notebook.content;
      if (!widgets.length) {
        return;
      }
      const widget = widgets.slice(-1)[0] as MarkdownCell;
      widget.promptNode.textContent = '';
      widget.promptNode.appendChild(runNode);
      new RunButton({
        node: runNode,
        cell: widget.model,
        onClick: () => commands.execute(CommandIDs.run)
      });
      clearInterval(runButtonInterval);
    }, 100);
  }

  async sendMarkdown(archiveUrl: string, model: IMarkdownCellModel) {
    const archive = this._identityManager.datManager.getArchive(archiveUrl);
    const modelJson = model.toJSON();
    const buffer = Buffer.from(JSON.stringify(modelJson, null, 2));
    archive._archive.extension(ID, buffer);
    return buffer;
  }
}
