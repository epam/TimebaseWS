import {SidebarContextMenuItem} from '../../pages/streams/sidebar-context-menu/sidebar-context-menu-item';

export enum MenuItemType {
  identity = 'IDENTITY',
  stream = 'STREAM',
  space = 'SPACE',
  group = 'GROUP',
  view = 'VIEW',
}

export interface MenuItemMeta extends SidebarContextMenuItem {
  chartType?: {chartType: string, title: string}[];
}

export interface MenuItem {
  id?: string;
  name?: string;
  childrenCount?: number;
  totalCount?: number;
  type?: MenuItemType;
  children?: MenuItem[];
  chartType?: {chartType: string, title: string}[];
  meta?: MenuItemMeta;
  path?: string[];
  level?: number;
  original?: MenuItem;
  viewMd?: {
    state: string;
  };
}
