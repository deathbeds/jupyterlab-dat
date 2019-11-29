import { CommandRegistry } from '@phosphor/commands';
import { isMarkdownCellModel, MarkdownCell } from '@jupyterlab/cells';
import { NotebookPanel, NotebookActions } from '@jupyterlab/notebook';
import { DatChatModel } from './model';
import { Chatbook } from './chatbook';

import { CSS } from '.';

function makeMarkdown(nbWidget: NotebookPanel) {
  if (!isMarkdownCellModel(nbWidget.content.activeCell.model)) {
    NotebookActions.changeCellType(nbWidget.content, 'markdown');
    NotebookActions.run(nbWidget.content);
  }
}

export const CommandIDs = {
  runAndSelectNext: 'notebook:run-cell-and-select-next',
  runMenuRun: 'runmenu:run',
  run: 'notebook:run-cell'
};

export function setupCommands(
  commands: CommandRegistry,
  chatBook: Chatbook,
  nbWidget: NotebookPanel,
  chatModel: DatChatModel
) {
  function send() {
    const { content } = nbWidget;

    makeMarkdown(nbWidget);

    if (isMarkdownCellModel(content.activeCell.model)) {
      const buffer = chatModel.sendMarkdown(content.activeCell.model);
      chatBook.addMessage(chatModel.nextUrl, buffer);
      const cell = content.widgets.slice(-1)[0] as MarkdownCell;
      const { model } = cell;
      cell.rendered = false;
      model.value.text = '';
      cell.editor.focus();
      content.activeCellIndex = content.widgets.indexOf(cell);
      content.node.scrollTo(0, content.node.clientHeight);
    } else {
      return;
    }
  }

  commands.addKeyBinding({
    command: CommandIDs.runAndSelectNext,
    keys: ['Shift Enter'],
    selector: `.${CSS.WIDGET} .jp-Notebook`
  });
  commands.addKeyBinding({
    command: CommandIDs.run,
    keys: ['Accel Enter'],
    selector: `.${CSS.WIDGET} .jp-Notebook`
  });
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
}
