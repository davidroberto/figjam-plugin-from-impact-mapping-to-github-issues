import { BoardElement } from '../boardElement';
import { getElementTypeFromColor } from '../colorMapping';
import type { AnalyzeBoardElementsBoardReader } from './analyzeBoardElements.boardReader';

const VALID_SHAPE_TYPES = ['SQUARE', 'ROUNDED_RECTANGLE'];

export class AnalyzeBoardElementsUseCase {
  constructor(private readonly boardReader: AnalyzeBoardElementsBoardReader) {}

  execute(): BoardElement[] {
    const shapes = this.boardReader.readAllShapes();

    return shapes
      .filter((shape) => VALID_SHAPE_TYPES.includes(shape.shapeType))
      .filter((shape) => shape.text.trim().length > 0)
      .map((shape) => {
        const type = getElementTypeFromColor(shape.fillColor);
        if (!type) return undefined;
        return BoardElement.create(shape.id, type, shape.text);
      })
      .filter((el): el is BoardElement => el !== undefined);
  }
}
