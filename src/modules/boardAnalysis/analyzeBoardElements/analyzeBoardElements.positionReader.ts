import type { ShapePosition } from '../detectReleases/detectReleases.useCase';

export interface AnalyzeBoardElementsPositionReader {
  readAllPositions(): ShapePosition[];
}
