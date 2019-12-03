import { CSS as DAT, IDatManager } from '@deathbeds/jupyterlab-dat';

export const CSS = {
  WIDGET: 'jp-DatChat',
  BOOK: 'jp-DatChatbook',
  RUN: 'jp-DatChat-Run',
  DAT
};

export const ID = 'jupyterlab-dat-chat';

export const DAT_CHAT: IDatManager.IDatType = {
  name: ID,
  label: 'Chat',
  icon: CSS.DAT.ICON_NAMES.chat
};
