export interface GridStateModel {
  visibleArray: {colId: string; visible: boolean}[];
  pinnedArray: {colId: string; pinned: string}[];
  resizedArray: {colId: string; actualWidth: number}[];
  updatedColumnPrevs?: {[index: string]: string};
}
