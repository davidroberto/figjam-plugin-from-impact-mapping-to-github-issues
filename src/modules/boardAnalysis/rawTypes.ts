export type RawBoardShape = {
  id: string;
  shapeType: string;
  fillColor: string; // hex uppercase
  text: string;
};

export type RawConnector = {
  startNodeId: string;
  endNodeId: string;
};

export type RawSection = {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
};
