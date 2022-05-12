import {SidebarContextMenuItem} from '../../pages/streams/sidebar-context-menu/sidebar-context-menu-item';

export enum MenuItemType {
  identity = 'IDENTITY',
  stream = 'STREAM',
  space = 'SPACE',
  group = 'GROUP',
}

export interface MenuItemMeta extends SidebarContextMenuItem {
  chartType?: string[];
}

export interface MenuItem {
  id: string;
  name: string;
  childrenCount: number;
  type: MenuItemType;
  children: MenuItem[];
  chartType?: string[];
  meta?: MenuItemMeta;
  path?: string[];
  level?: number;
  original?: MenuItem;
}
