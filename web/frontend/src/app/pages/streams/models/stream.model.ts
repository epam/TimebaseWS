export interface StreamModel {
  key: string;
  name: string;
  symbols: number;
  chartType?: { chartType: string, title: string }[];

  // all custom properties should starts from "_"
  _symbolsList?: string[];
  _spacesList?: SpaceModel[];
  _active: boolean;
  _shown: boolean;
}

export interface SpaceModel {
  name: string;
  _symbolsList?: string[];
  _shown?: boolean;
}

export const ROOT_SPACE_NAME = 'root';
