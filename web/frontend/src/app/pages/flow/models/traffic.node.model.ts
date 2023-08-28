export interface TrafficNodeModel {
  renderer: Renderer;
  layout: string;
  // OPTIONAL Override the default layout used for the renderer.
  name: string;
  // OPTIONAL Override the name on the label
  displayName: string;
  // OPTIONAL Any notices that you want to show up in the sidebar, for more details check the section on notices.
  notices?: [
    {
      // The title to display on the notice
      title: string;
      // OPTIONAL link to send the user when click on the notice
      link: string;
      // OPTIONAL 0(default) for info level, 1 for warning level, 2 for error level (applies CSS styling)
      severity: 0 | 1 | 2;
    },
  ];
  // Unix timestamp. Only checked at this level of nodes. Last time the data was updated (Needed because the client could be passed stale data when loaded)
  updated: number;
  // The maximum volume seen recently to relatively measure particle density
  maxVolume: number;
  nodes: [];
  connections: [];

  class: ColorTrafficType;
  node_type: string;
}

export type Renderer = 'global' | 'region';

export type ColorTrafficType = 'cursor' | 'loader' | 'stream' | 'application';
export const COLOR_TRAFFIC: {[type in ColorTrafficType]: string} = {
  cursor: '#5b63ff',
  loader: '#79ff79',
  stream: '#a8ffff',
  application: '#ffb4ff',
};

export class ShortTrafficNodeModel {
  name: string;
  text: string;
  type?: string;
  color?: string;

  constructor(node: TrafficNodeModel) {
    this.name = node.name;
    this.type = node.class;
    this.text = `${node.name} (${this.type})`;
    this.color = COLOR_TRAFFIC[node.class] || '';
  }
}
