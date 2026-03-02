import { expect } from 'vitest';
import { ElementType } from '../../../elementType';
import type { BoardElement } from '../../../boardElement';
import { AnalyzeBoardElementsUseCase } from '../../analyzeBoardElements.useCase';
import { AnalyzeBoardElementsInMemoryBoardReader } from '../analyzeBoardElements.inMemoryBoardReader';
import type {
  DetectsObjectiveByColorDsl,
  DetectsAllTypesByColorDsl,
  IgnoresUnknownColorDsl,
  IgnoresEmptyTextDsl,
  IgnoresNonRectangleShapesDsl,
} from '../analyzeBoardElements.dsl';

export class DetectsObjectiveByColorDriver
  implements DetectsObjectiveByColorDsl
{
  private readonly boardReader =
    new AnalyzeBoardElementsInMemoryBoardReader();
  private readonly useCase = new AnalyzeBoardElementsUseCase(this.boardReader);
  private result: BoardElement[] = [];

  givenABoardWithAnObjectiveShape(): void {
    this.boardReader.feedShapes([
      {
        id: 'obj-1',
        shapeType: 'ROUNDED_RECTANGLE',
        fillColor: '#1E3A8A',
        text: 'Améliorer la qualité',
      },
    ]);
  }

  whenAnalyzingBoardElements(): void {
    this.result = this.useCase.execute();
  }

  thenOneObjectiveElementIsDetected(): void {
    expect(this.result).toHaveLength(1);
    expect(this.result[0].id).toBe('obj-1');
    expect(this.result[0].type).toBe(ElementType.OBJECTIVE);
    expect(this.result[0].text).toBe('Améliorer la qualité');
  }
}

export class DetectsAllTypesByColorDriver
  implements DetectsAllTypesByColorDsl
{
  private readonly boardReader =
    new AnalyzeBoardElementsInMemoryBoardReader();
  private readonly useCase = new AnalyzeBoardElementsUseCase(this.boardReader);
  private result: BoardElement[] = [];

  givenABoardWithOneShapePerType(): void {
    this.boardReader.feedShapes([
      {
        id: 'obj-1',
        shapeType: 'SQUARE',
        fillColor: '#1E3A8A',
        text: 'Objective',
      },
      {
        id: 'actor-1',
        shapeType: 'SQUARE',
        fillColor: '#7C3AED',
        text: 'Actor',
      },
      {
        id: 'impact-1',
        shapeType: 'ROUNDED_RECTANGLE',
        fillColor: '#16A34A',
        text: 'Impact',
      },
      {
        id: 'action-1',
        shapeType: 'ROUNDED_RECTANGLE',
        fillColor: '#EA580C',
        text: 'Action',
      },
      {
        id: 'story-1',
        shapeType: 'ROUNDED_RECTANGLE',
        fillColor: '#FACC15',
        text: 'User Story',
      },
      {
        id: 'rule-1',
        shapeType: 'ROUNDED_RECTANGLE',
        fillColor: '#64748B',
        text: 'Rule',
      },
      {
        id: 'scenario-1',
        shapeType: 'ROUNDED_RECTANGLE',
        fillColor: '#CBD5E1',
        text: 'Scenario',
      },
    ]);
  }

  whenAnalyzingBoardElements(): void {
    this.result = this.useCase.execute();
  }

  thenAllTypesAreDetected(): void {
    expect(this.result).toHaveLength(7);
    const types = this.result.map((el) => el.type);
    expect(types).toEqual([
      ElementType.OBJECTIVE,
      ElementType.ACTOR,
      ElementType.IMPACT,
      ElementType.ACTION,
      ElementType.USER_STORY,
      ElementType.RULE,
      ElementType.SCENARIO,
    ]);
  }
}

export class IgnoresUnknownColorDriver implements IgnoresUnknownColorDsl {
  private readonly boardReader =
    new AnalyzeBoardElementsInMemoryBoardReader();
  private readonly useCase = new AnalyzeBoardElementsUseCase(this.boardReader);
  private result: BoardElement[] = [];

  givenABoardWithAnUnknownColorShape(): void {
    this.boardReader.feedShapes([
      {
        id: 'unknown-1',
        shapeType: 'ROUNDED_RECTANGLE',
        fillColor: '#FF0000',
        text: 'Unknown',
      },
    ]);
  }

  whenAnalyzingBoardElements(): void {
    this.result = this.useCase.execute();
  }

  thenNoElementIsDetected(): void {
    expect(this.result).toHaveLength(0);
  }
}

export class IgnoresEmptyTextDriver implements IgnoresEmptyTextDsl {
  private readonly boardReader =
    new AnalyzeBoardElementsInMemoryBoardReader();
  private readonly useCase = new AnalyzeBoardElementsUseCase(this.boardReader);
  private result: BoardElement[] = [];

  givenABoardWithAnEmptyTextShape(): void {
    this.boardReader.feedShapes([
      {
        id: 'empty-1',
        shapeType: 'ROUNDED_RECTANGLE',
        fillColor: '#1E3A8A',
        text: '   ',
      },
    ]);
  }

  whenAnalyzingBoardElements(): void {
    this.result = this.useCase.execute();
  }

  thenNoElementIsDetected(): void {
    expect(this.result).toHaveLength(0);
  }
}

export class IgnoresNonRectangleShapesDriver
  implements IgnoresNonRectangleShapesDsl
{
  private readonly boardReader =
    new AnalyzeBoardElementsInMemoryBoardReader();
  private readonly useCase = new AnalyzeBoardElementsUseCase(this.boardReader);
  private result: BoardElement[] = [];

  givenABoardWithNonRectangleShapes(): void {
    this.boardReader.feedShapes([
      {
        id: 'ellipse-1',
        shapeType: 'ELLIPSE',
        fillColor: '#1E3A8A',
        text: 'Objective',
      },
      {
        id: 'diamond-1',
        shapeType: 'DIAMOND',
        fillColor: '#7C3AED',
        text: 'Actor',
      },
    ]);
  }

  whenAnalyzingBoardElements(): void {
    this.result = this.useCase.execute();
  }

  thenNoElementIsDetected(): void {
    expect(this.result).toHaveLength(0);
  }
}
