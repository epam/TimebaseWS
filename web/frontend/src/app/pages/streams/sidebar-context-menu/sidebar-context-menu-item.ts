import {MenuItem} from '../../../shared/models/menu-item';

export interface SidebarContextMenuItem {
  stream: MenuItem;
  symbol?: string;
  space?: MenuItem;
}
