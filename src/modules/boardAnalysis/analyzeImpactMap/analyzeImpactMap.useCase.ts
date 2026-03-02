import { ImpactMapping, type ImpactMappingJson } from '../impactMapping';
import type { AnalyzeImpactMapBoardReader } from './analyzeImpactMap.boardReader';

export class AnalyzeImpactMapUseCase {
  constructor(
    private readonly boardReader: AnalyzeImpactMapBoardReader,
  ) {}

  execute(): ImpactMappingJson {
    const board = this.boardReader.readBoard();

    return ImpactMapping
      .generateFromBoard(board.shapes, board.connectors, board.sections)
      .toJson();
  }
}
