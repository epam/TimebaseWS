export interface TreeItem {
  id?: string;
  name: string;
  isStaticField?: boolean;
  children?: TreeItem[];
  showChildren?: boolean;
  checked?: boolean;
  partialChecked?: boolean;
  parent?: TreeItem;
  hiddenBySearch?: boolean;
}
