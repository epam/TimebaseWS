export interface NodeCoordinates {
  x: number;
  y: number;
}

export interface NodePositions {
  [index: string]: NodeCoordinates;
}

export interface InitialNodePositions {
  [indexNode: string]: NodePositions;
}

export interface NodeCoordinatesOutOfView {
  x: boolean;
  y: boolean;
}

export interface NodesOutOfView {
  [indexNode: string]: NodeCoordinatesOutOfView;
}