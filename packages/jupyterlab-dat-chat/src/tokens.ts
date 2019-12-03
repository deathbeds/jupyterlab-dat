import { dat } from '@deathbeds/dat-sdk-webpack';
import { ISignal } from '@phosphor/signaling';
import { ServiceManager } from '@jupyterlab/services';
import { NotebookPanel } from '@jupyterlab/notebook';
import { IDatIdentityManager } from '@deathbeds/jupyterlab-dat-identity/lib/tokens';
import { CommandRegistry } from '@phosphor/commands';
import { IMarkdownCellModel } from '@jupyterlab/cells';

export interface IDatChatManager {
  widgetRequested: ISignal<IDatChatManager, NotebookPanel>;
  identityManager: IDatIdentityManager;
  addMessage(context: IDatChatManager.IMessageContext): Promise<void>;
  createWidget(archiveUrl: string): Promise<NotebookPanel>;
  sendMarkdown(archiveUrl: string, model: IMarkdownCellModel): Promise<Buffer>;
  requestWidget(archiveUrl: string): Promise<void>;
  addRunButton(notebook: NotebookPanel, commands: CommandRegistry): void;
  notebookUrls: string[];
}

export namespace IDatChatManager {
  export interface IOptions {
    serviceManager: ServiceManager;
    identityManager: IDatIdentityManager;
  }
  export interface IMessageContext {
    notebook?: NotebookPanel;
    archiveUrl: string;
    message: Buffer;
    peer: dat.IHyperdrive.IPeer;
  }
  export interface ICommandsContext {
    archiveUrl: string;
    commands: CommandRegistry;
    manager: IDatChatManager;
    notebook: NotebookPanel;
  }
}
