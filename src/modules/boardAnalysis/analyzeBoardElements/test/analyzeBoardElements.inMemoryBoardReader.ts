import type { RawBoardShape } from '../../rawTypes';
import type { AnalyzeBoardElementsBoardReader } from '../analyzeBoardElements.boardReader';

export class AnalyzeBoardElementsInMemoryBoardReader
  implements AnalyzeBoardElementsBoardReader
{
  private shapes: RawBoardShape[] = [];

  feedShapes(shapes: RawBoardShape[]): void {
    this.shapes = shapes;
  }

  readAllShapes(): RawBoardShape[] {
    return this.shapes;
  }
}
