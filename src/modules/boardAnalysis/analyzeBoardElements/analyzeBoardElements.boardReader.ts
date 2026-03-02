import type { RawBoardShape } from '../rawTypes';

export interface AnalyzeBoardElementsBoardReader {
  readAllShapes(): RawBoardShape[];
}
