import { CSS as DAT, IDatManager } from '@deathbeds/jupyterlab-dat';

export const CSS = {
  WIDGET: 'jp-DatChat',
  BOOK: 'jp-DatChatbook',
  DAT
};

export const ID = 'jupyterlab-dat-chat';

export const DAT_CHAT: IDatManager.IDatType = {
  name: ID,
  label: 'Chat',
  icon: 'dat-hexagon-chat'
};
