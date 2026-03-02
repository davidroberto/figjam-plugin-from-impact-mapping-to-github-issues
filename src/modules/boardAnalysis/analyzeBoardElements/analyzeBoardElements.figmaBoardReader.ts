import { rgbToHex } from '../colorMapping';
import type { RawBoardShape } from '../rawTypes';
import type { AnalyzeBoardElementsBoardReader } from './analyzeBoardElements.boardReader';

export class AnalyzeBoardElementsFigmaBoardReader
  implements AnalyzeBoardElementsBoardReader
{
  readAllShapes(): RawBoardShape[] {
    const shapes: RawBoardShape[] = [];
    const nodes = figma.currentPage.findAll(
      (node) => node.type === 'SHAPE_WITH_TEXT',
    ) as ShapeWithTextNode[];

    for (const node of nodes) {
      const fill = this.extractFillColor(node);
      if (!fill) continue;

      shapes.push({
        id: node.id,
        shapeType: node.shapeType,
        fillColor: fill,
        text: node.text.characters,
      });
    }

    return shapes;
  }

  private extractFillColor(node: ShapeWithTextNode): string | undefined {
    const fills = node.fills;
    if (!Array.isArray(fills) || fills.length === 0) return undefined;
    const solidFill = fills.find(
      (f): f is SolidPaint => f.type === 'SOLID' && f.visible !== false,
    );
    if (!solidFill) return undefined;
    return rgbToHex(solidFill.color.r, solidFill.color.g, solidFill.color.b);
  }
}
