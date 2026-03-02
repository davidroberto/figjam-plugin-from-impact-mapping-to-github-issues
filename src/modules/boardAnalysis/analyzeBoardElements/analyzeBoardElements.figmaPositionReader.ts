import type { ShapePosition } from '../detectReleases/detectReleases.useCase';
import type { AnalyzeBoardElementsPositionReader } from './analyzeBoardElements.positionReader';

export class AnalyzeBoardElementsFigmaPositionReader
  implements AnalyzeBoardElementsPositionReader
{
  readAllPositions(): ShapePosition[] {
    const nodes = figma.currentPage.findAll(
      (node) => node.type === 'SHAPE_WITH_TEXT',
    ) as ShapeWithTextNode[];

    return nodes.map((node) => ({
      elementId: node.id,
      x: node.absoluteTransform[0][2],
      y: node.absoluteTransform[1][2],
      width: node.width,
      height: node.height,
    }));
  }
}
