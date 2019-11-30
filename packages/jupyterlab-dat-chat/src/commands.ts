import { CommandRegistry } from '@phosphor/commands';
import { isMarkdownCellModel, MarkdownCell } from '@jupyterlab/cells';
import { NotebookPanel, NotebookActions } from '@jupyterlab/notebook';
import { DatChatModel } from './model';
import { Chatbook } from './chatbook';

import { CSS, ID } from '.';

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
  async function send() {
    const { content } = nbWidget;
    const { activeCellIndex, widgets } = content;

    makeMarkdown(nbWidget);

    const { activeCell } = content;

    if (
      isMarkdownCellModel(activeCell.model) &&
      activeCellIndex === widgets.length - 1
    ) {
      activeCell.model.metadata.set(ID, { handle: chatModel.handle });
      const buffer = await chatModel.sendMarkdown(activeCell.model);
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
