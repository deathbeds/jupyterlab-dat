import { isMarkdownCellModel, MarkdownCell } from '@jupyterlab/cells';
import { NotebookPanel, NotebookActions } from '@jupyterlab/notebook';
import { IDatChatManager } from './tokens';

import { CSS, ID } from '.';

function makeMarkdown(nbWidget: NotebookPanel) {
  if (!isMarkdownCellModel(nbWidget.content.activeCell.model)) {
    NotebookActions.changeCellType(nbWidget.content, 'markdown');
    NotebookActions.run(nbWidget.content);
  }
}

export const CommandIDs = {
  commandMode: 'notebook:enter-command-mode',
  copy: 'notebook:copy-cell',
  run: 'notebook:run-cell',
  runAndSelectNext: 'notebook:run-cell-and-select-next',
  runMenuRun: 'runmenu:run',
  selectAbove: 'notebook:move-cursor-up',
  selectBelow: 'notebook:move-cursor-down'
};

export function setupCommands(context: IDatChatManager.ICommandsContext) {
  const { archiveUrl, commands, manager, notebook } = context;
  const { content } = notebook;

  async function send() {
    const { activeCellIndex, widgets } = content;
    notebook.activate();

    makeMarkdown(notebook);

    const { activeCell } = content;

    if (
      isMarkdownCellModel(activeCell.model) &&
      activeCellIndex === widgets.length - 1
    ) {
      activeCell.model.metadata.set(ID, {
        handle: manager.identityManager.me.handle
      });
      const message = await manager.sendMarkdown(archiveUrl, activeCell.model);
      manager.addMessage({
        archiveUrl,
        message,
        notebook,
        peer: null
      });
      const cell = content.widgets.slice(-1)[0] as MarkdownCell;
      const { model } = cell;
      cell.rendered = false;
      model.value.text = '';
      cell.editor.focus();
      content.activeCellIndex = content.widgets.indexOf(cell);
      content.node.scrollTo(0, content.node.clientHeight);
    }
  }

  // commands
  commands.addCommand(CommandIDs.runAndSelectNext, {
    label: 'Run and Advance',
    execute: send
  });
  commands.addCommand(CommandIDs.run, {
    label: 'Run',
    execute: send
  });
  commands.addCommand(CommandIDs.runMenuRun, {
    label: 'Run',
    execute: send
  });

  commands.addCommand(CommandIDs.selectAbove, {
    label: 'Select Cell Above',
    execute: args => NotebookActions.selectAbove(content)
  });

  commands.addCommand(CommandIDs.selectBelow, {
    label: 'Select Cell Below',
    execute: args => NotebookActions.selectBelow(content)
  });

  commands.addCommand(CommandIDs.copy, {
    label: 'Copy Cells',
    execute: args => [console.log('copy'), NotebookActions.copy(content)]
  });

  commands.addCommand(CommandIDs.commandMode, {
    label: 'Enter Command Mode',
    execute: args => (content.mode = 'command')
  });

  const selector = `.${CSS.BOOK} .jp-Notebook`;

  const commandMode = `${selector}.jp-mod-commandMode`;
  const editMode = `${selector}.jp-mod-editMode`;

  // edit keys
  commands.addKeyBinding({
    command: CommandIDs.runAndSelectNext,
    keys: ['Shift Enter'],
    selector: editMode
  });
  commands.addKeyBinding({
    command: CommandIDs.run,
    keys: ['Accel Enter'],
    selector: editMode
  });

  // command keys
  commands.addKeyBinding({
    command: CommandIDs.selectAbove,
    keys: ['ArrowUp'],
    selector: commandMode
  });
  commands.addKeyBinding({
    command: CommandIDs.selectBelow,
    keys: ['ArrowDown'],
    selector: commandMode
  });
  commands.addKeyBinding({
    command: CommandIDs.copy,
    keys: ['C'],
    selector: commandMode
  });
  commands.addKeyBinding({
    command: CommandIDs.commandMode,
    keys: ['Esc'],
    selector
  });
}
