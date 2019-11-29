import { CommandRegistry } from '@phosphor/commands';
import { isMarkdownCellModel } from '@jupyterlab/cells';
import { NotebookPanel, NotebookActions } from '@jupyterlab/notebook';
import { DatChatModel } from './model';

function makeMarkdown(nbWidget: NotebookPanel) {
  if (!isMarkdownCellModel(nbWidget.content.activeCell.model)) {
    NotebookActions.changeCellType(nbWidget.content, 'markdown');
    NotebookActions.run(nbWidget.content);
  }
}

export const CommandIDs = {
  runAndSelectNext: 'notebook:run-cell-and-select-next',
  run: 'runmenu:run'
};

export function setupCommands(
  commands: CommandRegistry,
  nbWidget: NotebookPanel,
  chatModel: DatChatModel
) {
  function send() {
    makeMarkdown(nbWidget);
    if (isMarkdownCellModel(nbWidget.content.activeCell.model)) {
      chatModel.sendMarkdown(nbWidget.content.activeCell.model);
    }
    NotebookActions.runAndAdvance(nbWidget.content, nbWidget.context.session);
    makeMarkdown(nbWidget);
  }

  commands.addKeyBinding({
    command: CommandIDs.runAndSelectNext,
    keys: ['Shift Enter'],
    selector: '.jp-Notebook.jp-mod-editMode'
  });
  commands.addKeyBinding({
    command: CommandIDs.run,
    keys: ['Shift Enter'],
    selector: '.jp-Notebook.jp-mod-commandMode'
  });
  commands.addCommand(CommandIDs.runAndSelectNext, {
    label: 'Run and Advance',
    execute: send
  });
  commands.addCommand(CommandIDs.run, {
    label: 'Run',
    execute: send
  });
}
