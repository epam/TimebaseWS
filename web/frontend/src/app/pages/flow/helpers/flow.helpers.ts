import { NodePositions } from "../models/node-positions.types";

export class closeСoordinateParams {
  positions: NodePositions;
  nodeName: string;
  targetNodeName: string;
  coordinate: string;
  targetIsIndexNode?: boolean = false;
  constructor() {}
}

export function filterNodesWithCloseCoordinate(params: closeСoordinateParams) {
  const {positions, nodeName, targetNodeName, coordinate, targetIsIndexNode} = params;
  const distance = targetIsIndexNode ? 140 : 20;
  return (positions[nodeName][coordinate] >= positions[targetNodeName][coordinate]) ?
    positions[nodeName][coordinate] - positions[targetNodeName][coordinate] < distance :
    positions[targetNodeName][coordinate] - positions[nodeName][coordinate] < distance;
}