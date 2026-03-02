export interface DetectsObjectiveByColorDsl {
  givenABoardWithAnObjectiveShape(): void;
  whenAnalyzingBoardElements(): void;
  thenOneObjectiveElementIsDetected(): void;
}

export interface DetectsAllTypesByColorDsl {
  givenABoardWithOneShapePerType(): void;
  whenAnalyzingBoardElements(): void;
  thenAllTypesAreDetected(): void;
}

export interface IgnoresUnknownColorDsl {
  givenABoardWithAnUnknownColorShape(): void;
  whenAnalyzingBoardElements(): void;
  thenNoElementIsDetected(): void;
}

export interface IgnoresEmptyTextDsl {
  givenABoardWithAnEmptyTextShape(): void;
  whenAnalyzingBoardElements(): void;
  thenNoElementIsDetected(): void;
}

export interface IgnoresNonRectangleShapesDsl {
  givenABoardWithNonRectangleShapes(): void;
  whenAnalyzingBoardElements(): void;
  thenNoElementIsDetected(): void;
}
