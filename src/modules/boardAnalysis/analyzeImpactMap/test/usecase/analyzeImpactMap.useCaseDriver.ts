import { expect } from 'vitest';
import { ElementType } from '../../../element';
import { AnalyzeImpactMapUseCase } from '../../analyzeImpactMap.useCase';
import type { ImpactMappingJson } from '../../../impactMapping';
import { AnalyzeImpactMapInMemoryBoardReader } from '../analyzeImpactMap.inMemoryBoardReader';
import type {
  DetectsObjectiveByColorDsl,
  DetectsAllTypesByColorDsl,
  IgnoresUnknownColorDsl,
  IgnoresEmptyTextDsl,
  IgnoresNonRectangleShapesDsl,
  DetectsReleaseSectionDsl,
  IgnoresSectionsWithEmptyNameDsl,
  BuildsLinearHierarchyDsl,
  HandlesMultipleChildrenDsl,
  AssignsAndPropagatesReleaseDsl,
  ExcludesShapesWithoutConnectorDsl,
  FullIntegrationDsl,
} from '../analyzeImpactMap.dsl';

export class DetectsObjectiveByColorDriver
  implements DetectsObjectiveByColorDsl
{
  private readonly boardReader = new AnalyzeImpactMapInMemoryBoardReader();
  private readonly useCase = new AnalyzeImpactMapUseCase(this.boardReader);
  private result!: ImpactMappingJson;

  givenABoardWithAnObjectiveShape(): void {
    this.boardReader.feedShapes([
      {
        id: 'obj-1',
        shapeType: 'ROUNDED_RECTANGLE',
        fillColor: '#1E3A8A',
        text: 'Améliorer la qualité',
      },
      {
        id: 'actor-1',
        shapeType: 'ROUNDED_RECTANGLE',
        fillColor: '#7C3AED',
        text: 'Actor',
      },
    ]);
    this.boardReader.feedConnectors([
      { startNodeId: 'obj-1', endNodeId: 'actor-1' },
    ]);
  }

  whenAnalyzingImpactMap(): void {
    this.result = this.useCase.execute();
  }

  thenOneObjectiveElementIsDetected(): void {
    expect(this.result.hierarchizedElements).toHaveLength(1);
    expect(this.result.hierarchizedElements[0].id).toBe('obj-1');
    expect(this.result.hierarchizedElements[0].type).toBe(ElementType.OBJECTIVE);
    expect(this.result.hierarchizedElements[0].title).toBe('Améliorer la qualité');
  }
}

export class DetectsAllTypesByColorDriver
  implements DetectsAllTypesByColorDsl
{
  private readonly boardReader = new AnalyzeImpactMapInMemoryBoardReader();
  private readonly useCase = new AnalyzeImpactMapUseCase(this.boardReader);
  private result!: ImpactMappingJson;

  givenABoardWithOneShapePerType(): void {
    this.boardReader.feedShapes([
      { id: 'obj-1', shapeType: 'SQUARE', fillColor: '#1E3A8A', text: 'Objective' },
      { id: 'actor-1', shapeType: 'SQUARE', fillColor: '#7C3AED', text: 'Actor' },
      { id: 'impact-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#16A34A', text: 'Impact' },
      { id: 'action-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#EA580C', text: 'Action' },
      { id: 'story-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#FACC15', text: 'User Story' },
      { id: 'rule-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#64748B', text: 'Rule' },
      { id: 'scenario-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#CBD5E1', text: 'Scenario' },
    ]);
    this.boardReader.feedConnectors([
      { startNodeId: 'obj-1', endNodeId: 'actor-1' },
      { startNodeId: 'actor-1', endNodeId: 'impact-1' },
      { startNodeId: 'impact-1', endNodeId: 'action-1' },
      { startNodeId: 'action-1', endNodeId: 'story-1' },
      { startNodeId: 'story-1', endNodeId: 'rule-1' },
      { startNodeId: 'rule-1', endNodeId: 'scenario-1' },
    ]);
  }

  whenAnalyzingImpactMap(): void {
    this.result = this.useCase.execute();
  }

  thenAllTypesAreDetected(): void {
    const obj = this.result.hierarchizedElements[0];
    expect(obj.type).toBe(ElementType.OBJECTIVE);
    expect(obj.children[0].type).toBe(ElementType.ACTOR);
    expect(obj.children[0].children[0].type).toBe(ElementType.IMPACT);
    expect(obj.children[0].children[0].children[0].type).toBe(ElementType.ACTION);
    expect(obj.children[0].children[0].children[0].children[0].type).toBe(ElementType.USER_STORY);
    expect(obj.children[0].children[0].children[0].children[0].children[0].type).toBe(ElementType.RULE);
    expect(obj.children[0].children[0].children[0].children[0].children[0].children[0].type).toBe(ElementType.SCENARIO);
  }
}

export class IgnoresUnknownColorDriver implements IgnoresUnknownColorDsl {
  private readonly boardReader = new AnalyzeImpactMapInMemoryBoardReader();
  private readonly useCase = new AnalyzeImpactMapUseCase(this.boardReader);
  private result!: ImpactMappingJson;

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

  whenAnalyzingImpactMap(): void {
    this.result = this.useCase.execute();
  }

  thenNoElementIsDetected(): void {
    expect(this.result.hierarchizedElements).toHaveLength(0);
  }
}

export class IgnoresEmptyTextDriver implements IgnoresEmptyTextDsl {
  private readonly boardReader = new AnalyzeImpactMapInMemoryBoardReader();
  private readonly useCase = new AnalyzeImpactMapUseCase(this.boardReader);
  private result!: ImpactMappingJson;

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

  whenAnalyzingImpactMap(): void {
    this.result = this.useCase.execute();
  }

  thenNoElementIsDetected(): void {
    expect(this.result.hierarchizedElements).toHaveLength(0);
  }
}

export class IgnoresNonRectangleShapesDriver
  implements IgnoresNonRectangleShapesDsl
{
  private readonly boardReader = new AnalyzeImpactMapInMemoryBoardReader();
  private readonly useCase = new AnalyzeImpactMapUseCase(this.boardReader);
  private result!: ImpactMappingJson;

  givenABoardWithNonRectangleShapes(): void {
    this.boardReader.feedShapes([
      { id: 'ellipse-1', shapeType: 'ELLIPSE', fillColor: '#1E3A8A', text: 'Objective' },
      { id: 'diamond-1', shapeType: 'DIAMOND', fillColor: '#7C3AED', text: 'Actor' },
    ]);
  }

  whenAnalyzingImpactMap(): void {
    this.result = this.useCase.execute();
  }

  thenNoElementIsDetected(): void {
    expect(this.result.hierarchizedElements).toHaveLength(0);
  }
}

export class DetectsReleaseSectionDriver implements DetectsReleaseSectionDsl {
  private readonly boardReader = new AnalyzeImpactMapInMemoryBoardReader();
  private readonly useCase = new AnalyzeImpactMapUseCase(this.boardReader);
  private result!: ImpactMappingJson;

  givenASectionAndAnElementInsideIt(): void {
    this.boardReader.feedShapes([
      { id: 'obj-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#1E3A8A', text: 'Objective', x: 100, y: 100, width: 200, height: 100 },
      { id: 'actor-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#7C3AED', text: 'Actor', x: 100, y: 100, width: 200, height: 100 },
      { id: 'impact-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#16A34A', text: 'Impact', x: 100, y: 100, width: 200, height: 100 },
      { id: 'action-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#EA580C', text: 'Action', x: 100, y: 100, width: 200, height: 100 },
      { id: 'story-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#FACC15', text: 'A user story', x: 100, y: 100, width: 200, height: 100 },
    ]);
    this.boardReader.feedConnectors([
      { startNodeId: 'obj-1', endNodeId: 'actor-1' },
      { startNodeId: 'actor-1', endNodeId: 'impact-1' },
      { startNodeId: 'impact-1', endNodeId: 'action-1' },
      { startNodeId: 'action-1', endNodeId: 'story-1' },
    ]);
    this.boardReader.feedSections([
      { name: 'MVP', x: 0, y: 0, width: 500, height: 500 },
    ]);
  }

  whenAnalyzingImpactMap(): void {
    this.result = this.useCase.execute();
  }

  thenTheElementIsAssignedToTheRelease(): void {
    const story = this.result.hierarchizedElements[0].children[0].children[0].children[0].children[0];
    expect(story.release).toBe('MVP');
  }
}

export class IgnoresSectionsWithEmptyNameDriver
  implements IgnoresSectionsWithEmptyNameDsl
{
  private readonly boardReader = new AnalyzeImpactMapInMemoryBoardReader();
  private readonly useCase = new AnalyzeImpactMapUseCase(this.boardReader);
  private result!: ImpactMappingJson;

  givenASectionWithEmptyNameAndAnElementInsideIt(): void {
    this.boardReader.feedShapes([
      { id: 'obj-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#1E3A8A', text: 'Objective', x: 100, y: 100, width: 200, height: 100 },
      { id: 'actor-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#7C3AED', text: 'Actor', x: 100, y: 100, width: 200, height: 100 },
      { id: 'impact-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#16A34A', text: 'Impact', x: 100, y: 100, width: 200, height: 100 },
      { id: 'action-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#EA580C', text: 'Action', x: 100, y: 100, width: 200, height: 100 },
      { id: 'story-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#FACC15', text: 'A user story', x: 100, y: 100, width: 200, height: 100 },
    ]);
    this.boardReader.feedConnectors([
      { startNodeId: 'obj-1', endNodeId: 'actor-1' },
      { startNodeId: 'actor-1', endNodeId: 'impact-1' },
      { startNodeId: 'impact-1', endNodeId: 'action-1' },
      { startNodeId: 'action-1', endNodeId: 'story-1' },
    ]);
    this.boardReader.feedSections([
      { name: '   ', x: 0, y: 0, width: 500, height: 500 },
    ]);
  }

  whenAnalyzingImpactMap(): void {
    this.result = this.useCase.execute();
  }

  thenNoReleaseIsAssigned(): void {
    const story = this.result.hierarchizedElements[0].children[0].children[0].children[0].children[0];
    expect(story.release).toBeUndefined();
  }
}

export class BuildsLinearHierarchyDriver implements BuildsLinearHierarchyDsl {
  private readonly boardReader = new AnalyzeImpactMapInMemoryBoardReader();
  private readonly useCase = new AnalyzeImpactMapUseCase(this.boardReader);
  private result!: ImpactMappingJson;

  givenALinearChainOfElements(): void {
    this.boardReader.feedShapes([
      { id: 'obj-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#1E3A8A', text: 'Objective' },
      { id: 'actor-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#7C3AED', text: 'Actor' },
      { id: 'impact-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#16A34A', text: 'Impact' },
    ]);
    this.boardReader.feedConnectors([
      { startNodeId: 'obj-1', endNodeId: 'actor-1' },
      { startNodeId: 'actor-1', endNodeId: 'impact-1' },
    ]);
  }

  whenAnalyzingImpactMap(): void {
    this.result = this.useCase.execute();
  }

  thenALinearHierarchyIsProduced(): void {
    expect(this.result.hierarchizedElements).toHaveLength(1);
    const obj = this.result.hierarchizedElements[0];
    expect(obj.id).toBe('obj-1');
    expect(obj.type).toBe(ElementType.OBJECTIVE);
    expect(obj.children).toHaveLength(1);

    const actor = obj.children[0];
    expect(actor.id).toBe('actor-1');
    expect(actor.parentId).toBe('obj-1');
    expect(actor.children).toHaveLength(1);

    const impact = actor.children[0];
    expect(impact.id).toBe('impact-1');
    expect(impact.parentId).toBe('actor-1');
    expect(impact.children).toHaveLength(0);
  }
}

export class HandlesMultipleChildrenDriver
  implements HandlesMultipleChildrenDsl
{
  private readonly boardReader = new AnalyzeImpactMapInMemoryBoardReader();
  private readonly useCase = new AnalyzeImpactMapUseCase(this.boardReader);
  private result!: ImpactMappingJson;

  givenARuleWithTwoScenarios(): void {
    this.boardReader.feedShapes([
      { id: 'obj-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#1E3A8A', text: 'Objective' },
      { id: 'actor-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#7C3AED', text: 'Actor' },
      { id: 'impact-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#16A34A', text: 'Impact' },
      { id: 'action-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#EA580C', text: 'Action' },
      { id: 'story-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#FACC15', text: 'Story' },
      { id: 'rule-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#64748B', text: 'Rule' },
      { id: 'scenario-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#CBD5E1', text: 'Scenario A' },
      { id: 'scenario-2', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#CBD5E1', text: 'Scenario B' },
    ]);
    this.boardReader.feedConnectors([
      { startNodeId: 'obj-1', endNodeId: 'actor-1' },
      { startNodeId: 'actor-1', endNodeId: 'impact-1' },
      { startNodeId: 'impact-1', endNodeId: 'action-1' },
      { startNodeId: 'action-1', endNodeId: 'story-1' },
      { startNodeId: 'story-1', endNodeId: 'rule-1' },
      { startNodeId: 'rule-1', endNodeId: 'scenario-1' },
      { startNodeId: 'rule-1', endNodeId: 'scenario-2' },
    ]);
  }

  whenAnalyzingImpactMap(): void {
    this.result = this.useCase.execute();
  }

  thenTheRuleHasTwoScenarioChildren(): void {
    const rule =
      this.result.hierarchizedElements[0].children[0].children[0].children[0]
        .children[0].children[0];
    expect(rule.id).toBe('rule-1');
    expect(rule.children).toHaveLength(2);
    expect(rule.children[0].id).toBe('scenario-1');
    expect(rule.children[1].id).toBe('scenario-2');
  }
}

export class AssignsAndPropagatesReleaseDriver
  implements AssignsAndPropagatesReleaseDsl
{
  private readonly boardReader = new AnalyzeImpactMapInMemoryBoardReader();
  private readonly useCase = new AnalyzeImpactMapUseCase(this.boardReader);
  private result!: ImpactMappingJson;

  givenAUserStoryWithReleaseAndChildren(): void {
    this.boardReader.feedShapes([
      { id: 'obj-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#1E3A8A', text: 'Objective' },
      { id: 'actor-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#7C3AED', text: 'Actor' },
      { id: 'impact-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#16A34A', text: 'Impact' },
      { id: 'action-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#EA580C', text: 'Action' },
      { id: 'story-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#FACC15', text: 'Story', x: 100, y: 100, width: 200, height: 100 },
      { id: 'rule-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#64748B', text: 'Rule' },
      { id: 'scenario-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#CBD5E1', text: 'Scenario' },
    ]);
    this.boardReader.feedConnectors([
      { startNodeId: 'obj-1', endNodeId: 'actor-1' },
      { startNodeId: 'actor-1', endNodeId: 'impact-1' },
      { startNodeId: 'impact-1', endNodeId: 'action-1' },
      { startNodeId: 'action-1', endNodeId: 'story-1' },
      { startNodeId: 'story-1', endNodeId: 'rule-1' },
      { startNodeId: 'rule-1', endNodeId: 'scenario-1' },
    ]);
    this.boardReader.feedSections([
      { name: 'MVP', x: 0, y: 0, width: 500, height: 500 },
    ]);
  }

  whenAnalyzingImpactMap(): void {
    this.result = this.useCase.execute();
  }

  thenReleaseIsPropagatedToChildren(): void {
    const story =
      this.result.hierarchizedElements[0].children[0].children[0].children[0]
        .children[0];
    expect(story.release).toBe('MVP');

    const rule = story.children[0];
    expect(rule.release).toBe('MVP');

    const scenario = rule.children[0];
    expect(scenario.release).toBe('MVP');
  }
}

export class ExcludesShapesWithoutConnectorDriver
  implements ExcludesShapesWithoutConnectorDsl
{
  private readonly boardReader = new AnalyzeImpactMapInMemoryBoardReader();
  private readonly useCase = new AnalyzeImpactMapUseCase(this.boardReader);
  private result!: ImpactMappingJson;

  givenElementsWithAndWithoutConnectors(): void {
    this.boardReader.feedShapes([
      { id: 'obj-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#1E3A8A', text: 'Connected objective' },
      { id: 'actor-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#7C3AED', text: 'Connected actor' },
      { id: 'obj-2', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#1E3A8A', text: 'Orphan objective' },
      { id: 'actor-2', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#7C3AED', text: 'Orphan actor' },
      { id: 'impact-solo', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#16A34A', text: 'Orphan impact' },
    ]);
    this.boardReader.feedConnectors([
      { startNodeId: 'obj-1', endNodeId: 'actor-1' },
    ]);
  }

  whenAnalyzingImpactMap(): void {
    this.result = this.useCase.execute();
  }

  thenOnlyConnectedElementsAreInTheHierarchy(): void {
    expect(this.result.hierarchizedElements).toHaveLength(1);
    expect(this.result.hierarchizedElements[0].id).toBe('obj-1');
    expect(this.result.hierarchizedElements[0].children).toHaveLength(1);
    expect(this.result.hierarchizedElements[0].children[0].id).toBe('actor-1');
  }
}

export class FullIntegrationDriver implements FullIntegrationDsl {
  private readonly boardReader = new AnalyzeImpactMapInMemoryBoardReader();
  private readonly useCase = new AnalyzeImpactMapUseCase(this.boardReader);
  private result!: ImpactMappingJson;

  givenTheCompleteImpactMappingBoard(): void {
    this.boardReader.feedShapes([
      {
        id: 'obj-1',
        shapeType: 'ROUNDED_RECTANGLE',
        fillColor: '#1E3A8A',
        text: 'Améliorer la qualité globale du delivery pendant les ateliers',
      },
      { id: 'actor-1', shapeType: 'ROUNDED_RECTANGLE', fillColor: '#7C3AED', text: 'Product Owner' },
      {
        id: 'impact-1',
        shapeType: 'ROUNDED_RECTANGLE',
        fillColor: '#16A34A',
        text: 'Identifier et rendre explicites les zones de flou',
      },
      {
        id: 'action-1',
        shapeType: 'ROUNDED_RECTANGLE',
        fillColor: '#EA580C',
        text: 'Challenger les user stories et règles pendant l\'atelier',
      },
      {
        id: 'story-1',
        shapeType: 'ROUNDED_RECTANGLE',
        fillColor: '#FACC15',
        text: 'En tant que Product Owner, je veux identifier les règles floues afin de clarifier les décisions produit',
        x: 100, y: 100, width: 200, height: 100,
      },
      {
        id: 'rule-1',
        shapeType: 'ROUNDED_RECTANGLE',
        fillColor: '#64748B',
        text: 'Les règles métier doivent être explicites et testables',
      },
      {
        id: 'scenario-1',
        shapeType: 'ROUNDED_RECTANGLE',
        fillColor: '#CBD5E1',
        text: 'Si une règle métier est ambiguë, elle doit être signalée et discutée pendant l\'atelier afin de lever toute interprétation.',
      },
      {
        id: 'scenario-2',
        shapeType: 'ROUNDED_RECTANGLE',
        fillColor: '#CBD5E1',
        text: 'Si plusieurs interprétations sont possibles pour une règle, le système doit générer une question de clarification.',
      },
    ]);
    this.boardReader.feedConnectors([
      { startNodeId: 'obj-1', endNodeId: 'actor-1' },
      { startNodeId: 'actor-1', endNodeId: 'impact-1' },
      { startNodeId: 'impact-1', endNodeId: 'action-1' },
      { startNodeId: 'action-1', endNodeId: 'story-1' },
      { startNodeId: 'story-1', endNodeId: 'rule-1' },
      { startNodeId: 'rule-1', endNodeId: 'scenario-1' },
      { startNodeId: 'rule-1', endNodeId: 'scenario-2' },
    ]);
    this.boardReader.feedSections([
      { name: 'MVP', x: 0, y: 0, width: 500, height: 500 },
    ]);
  }

  whenAnalyzingImpactMap(): void {
    this.result = this.useCase.execute();
  }

  thenTheExpectedJsonIsProduced(): void {
    expect(this.result.hierarchizedElements).toHaveLength(1);

    const obj = this.result.hierarchizedElements[0];
    expect(obj.id).toBe('obj-1');
    expect(obj.type).toBe(ElementType.OBJECTIVE);
    expect(obj.title).toBe(
      'Améliorer la qualité globale du delivery pendant les ateliers',
    );
    expect(obj.parentId).toBeUndefined();
    expect(obj.release).toBeUndefined();

    const actor = obj.children[0];
    expect(actor.id).toBe('actor-1');
    expect(actor.parentId).toBe('obj-1');

    const impact = actor.children[0];
    expect(impact.id).toBe('impact-1');
    expect(impact.parentId).toBe('actor-1');

    const action = impact.children[0];
    expect(action.id).toBe('action-1');
    expect(action.parentId).toBe('impact-1');

    const story = action.children[0];
    expect(story.id).toBe('story-1');
    expect(story.parentId).toBe('action-1');
    expect(story.release).toBe('MVP');

    const rule = story.children[0];
    expect(rule.id).toBe('rule-1');
    expect(rule.parentId).toBe('story-1');
    expect(rule.release).toBe('MVP');

    expect(rule.children).toHaveLength(2);

    const scenario1 = rule.children[0];
    expect(scenario1.id).toBe('scenario-1');
    expect(scenario1.parentId).toBe('rule-1');
    expect(scenario1.release).toBe('MVP');
    expect(scenario1.title).toBe('Cas nominal');
    expect(scenario1.text).toBe(
      'Si une règle métier est ambiguë, elle doit être signalée et discutée pendant l\'atelier afin de lever toute interprétation.',
    );

    const scenario2 = rule.children[1];
    expect(scenario2.id).toBe('scenario-2');
    expect(scenario2.parentId).toBe('rule-1');
    expect(scenario2.release).toBe('MVP');
    expect(scenario2.title).toBe('Cas nominal');
    expect(scenario2.text).toBe(
      'Si plusieurs interprétations sont possibles pour une règle, le système doit générer une question de clarification.',
    );
  }
}
