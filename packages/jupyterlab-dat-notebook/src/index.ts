import { IDatManager } from '@deathbeds/jupyterlab-dat';

import { CSS as DAT } from '@deathbeds/jupyterlab-dat';

export const CSS = DAT;

export const DAT_NOTEBOOK: IDatManager.IDatType = {
  name: 'jupyterlab-dat-notebook',
  label: 'Notebook',
  icon: CSS.ICON_NAMES.notebookPublish
};
