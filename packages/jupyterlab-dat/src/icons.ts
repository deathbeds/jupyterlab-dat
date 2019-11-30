import _dat_check from '!!raw-loader!dat-icons/icons/check.svg';
import _dat_hexagon_x from '!!raw-loader!dat-icons/icons/hexagon-x.svg';
import _dat_clipboard from '!!raw-loader!dat-icons/icons/clipboard.svg';
import _dat_import_dat from '!!raw-loader!dat-icons/icons/import-dat.svg';
import _dat_create_new_dat from '!!raw-loader!dat-icons/icons/create-new-dat.svg';
import _dat_info from '!!raw-loader!dat-icons/icons/info.svg';
import _dat_cross from '!!raw-loader!dat-icons/icons/cross.svg';
import _dat_letter from '!!raw-loader!dat-icons/icons/letter.svg';
import _dat_delete from '!!raw-loader!dat-icons/icons/delete.svg';
import _dat_link from '!!raw-loader!dat-icons/icons/link.svg';
import _dat_download from '!!raw-loader!dat-icons/icons/download.svg';
import _dat_loading from '!!raw-loader!dat-icons/icons/loading.svg';
import _dat_edit_dat from '!!raw-loader!dat-icons/icons/edit-dat.svg';
import _dat_lock from '!!raw-loader!dat-icons/icons/lock.svg';
import _dat_edit from '!!raw-loader!dat-icons/icons/edit.svg';
import _dat_menu from '!!raw-loader!dat-icons/icons/menu.svg';
import _dat_file from '!!raw-loader!dat-icons/icons/file.svg';
import _dat_network from '!!raw-loader!dat-icons/icons/network.svg';
import _dat_folder from '!!raw-loader!dat-icons/icons/folder.svg';
import _dat_open_in_desktop from '!!raw-loader!dat-icons/icons/open-in-desktop.svg';
import _dat_gear from '!!raw-loader!dat-icons/icons/gear.svg';
import _dat_open_in_finder from '!!raw-loader!dat-icons/icons/open-in-finder.svg';
import _dat_happy_dat from '!!raw-loader!dat-icons/icons/happy-dat.svg';
import _dat_plus from '!!raw-loader!dat-icons/icons/plus.svg';
import _dat_hexagon_down from '!!raw-loader!dat-icons/icons/hexagon-down.svg';
import _dat_question from '!!raw-loader!dat-icons/icons/question.svg';
import _dat_hexagon_outlines from '!!raw-loader!dat-icons/icons/hexagon-outlines.svg';
import _dat_sad_dat from '!!raw-loader!dat-icons/icons/sad-dat.svg';
import _dat_hexagon_pause from '!!raw-loader!dat-icons/icons/hexagon-pause.svg';
import _dat_search from '!!raw-loader!dat-icons/icons/search.svg';
import _dat_hexagon_resume from '!!raw-loader!dat-icons/icons/hexagon-resume.svg';
import _dat_star_dat from '!!raw-loader!dat-icons/icons/star-dat.svg';
import _dat_hexagon_up from '!!raw-loader!dat-icons/icons/hexagon-up.svg';
import _dat_hexagon_chat from '!!raw-loader!../style/icons/hexagon-chat.svg';

export const ICONS = [
  { name: 'dat-check', svg: _dat_check },
  { name: 'dat-hexagon-x', svg: _dat_hexagon_x },
  { name: 'dat-clipboard', svg: _dat_clipboard },
  { name: 'dat-import-dat', svg: _dat_import_dat },
  { name: 'dat-create-new-dat', svg: _dat_create_new_dat },
  { name: 'dat-info', svg: _dat_info },
  { name: 'dat-cross', svg: _dat_cross },
  { name: 'dat-letter', svg: _dat_letter },
  { name: 'dat-delete', svg: _dat_delete },
  { name: 'dat-link', svg: _dat_link },
  { name: 'dat-download', svg: _dat_download },
  { name: 'dat-loading', svg: _dat_loading },
  { name: 'dat-edit-dat', svg: _dat_edit_dat },
  { name: 'dat-lock', svg: _dat_lock },
  { name: 'dat-edit', svg: _dat_edit },
  { name: 'dat-menu', svg: _dat_menu },
  { name: 'dat-file', svg: _dat_file },
  { name: 'dat-network', svg: _dat_network },
  { name: 'dat-folder', svg: _dat_folder },
  { name: 'dat-open-in-desktop', svg: _dat_open_in_desktop },
  { name: 'dat-gear', svg: _dat_gear },
  { name: 'dat-open-in-finder', svg: _dat_open_in_finder },
  { name: 'dat-happy-dat', svg: _dat_happy_dat },
  { name: 'dat-plus', svg: _dat_plus },
  { name: 'dat-hexagon-down', svg: _dat_hexagon_down },
  { name: 'dat-question', svg: _dat_question },
  { name: 'dat-hexagon-outlines', svg: _dat_hexagon_outlines },
  { name: 'dat-sad-dat', svg: _dat_sad_dat },
  { name: 'dat-hexagon-pause', svg: _dat_hexagon_pause },
  { name: 'dat-search', svg: _dat_search },
  { name: 'dat-hexagon-resume', svg: _dat_hexagon_resume },
  { name: 'dat-star-dat', svg: _dat_star_dat },
  { name: 'dat-hexagon-up', svg: _dat_hexagon_up },
  { name: 'dat-hexagon-chat', svg: _dat_hexagon_chat }
].map(({ name, svg }) => {
  return {
    name,
    svg: svg
      .replace(/<title.*?title>/, '<g class="jp-icon3" fill="#616161">')
      .replace('</svg>', '</g></svg>')
  };
});
