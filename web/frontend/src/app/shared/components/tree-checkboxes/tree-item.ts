export interface TreeItem {
  id?: string;
  name: string;
  children?: TreeItem[];
  showChildren?: boolean;
  checked?: boolean;
  partialChecked?: boolean;
  parent?: TreeItem;
  hiddenBySearch?: boolean;
}
