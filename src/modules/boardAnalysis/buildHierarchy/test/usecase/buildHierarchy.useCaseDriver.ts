import { expect } from 'vitest';
import { ElementType } from '../../../elementType';
import { BoardElement } from '../../../boardElement';
import type { ReleaseAssignment } from '../../../detectReleases/detectReleases.useCase';
import {
  BuildHierarchyUseCase,
  type BuildHierarchyOutput,
} from '../../buildHierarchy.useCase';
import { BuildHierarchyInMemoryConnectorReader } from '../buildHierarchy.inMemoryConnectorReader';
import type {
  BuildsLinearHierarchyDsl,
  HandlesMultipleChildrenDsl,
  AssignsAndPropagatesReleaseDsl,
  ExcludesShapesWithoutConnectorDsl,
  FullIntegrationDsl,
} from '../buildHierarchy.dsl';

export class BuildsLinearHierarchyDriver implements BuildsLinearHierarchyDsl {
  private readonly connectorReader =
    new BuildHierarchyInMemoryConnectorReader();
  private readonly useCase = new BuildHierarchyUseCase(this.connectorReader);
  private elements: BoardElement[] = [];
  private result!: BuildHierarchyOutput;

  givenALinearChainOfElements(): void {
    this.elements = [
      BoardElement.create('obj-1', ElementType.OBJECTIVE, 'Objective'),
      BoardElement.create('actor-1', ElementType.ACTOR, 'Actor'),
      BoardElement.create('impact-1', ElementType.IMPACT, 'Impact'),
    ];
    this.connectorReader.feedConnectors([
      { startNodeId: 'obj-1', endNodeId: 'actor-1' },
      { startNodeId: 'actor-1', endNodeId: 'impact-1' },
    ]);
  }

  whenBuildingHierarchy(): void {
    this.result = this.useCase.execute(this.elements, []);
  }

  thenALinearHierarchyIsProduced(): void {
    expect(this.result.businessObjectives).toHaveLength(1);
    const obj = this.result.businessObjectives[0];
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
  private readonly connectorReader =
    new BuildHierarchyInMemoryConnectorReader();
  private readonly useCase = new BuildHierarchyUseCase(this.connectorReader);
  private elements: BoardElement[] = [];
  private result!: BuildHierarchyOutput;

  givenARuleWithTwoScenarios(): void {
    this.elements = [
      BoardElement.create('obj-1', ElementType.OBJECTIVE, 'Objective'),
      BoardElement.create('actor-1', ElementType.ACTOR, 'Actor'),
      BoardElement.create('impact-1', ElementType.IMPACT, 'Impact'),
      BoardElement.create('action-1', ElementType.ACTION, 'Action'),
      BoardElement.create('story-1', ElementType.USER_STORY, 'Story'),
      BoardElement.create('rule-1', ElementType.RULE, 'Rule'),
      BoardElement.create('scenario-1', ElementType.SCENARIO, 'Scenario A'),
      BoardElement.create('scenario-2', ElementType.SCENARIO, 'Scenario B'),
    ];
    this.connectorReader.feedConnectors([
      { startNodeId: 'obj-1', endNodeId: 'actor-1' },
      { startNodeId: 'actor-1', endNodeId: 'impact-1' },
      { startNodeId: 'impact-1', endNodeId: 'action-1' },
      { startNodeId: 'action-1', endNodeId: 'story-1' },
      { startNodeId: 'story-1', endNodeId: 'rule-1' },
      { startNodeId: 'rule-1', endNodeId: 'scenario-1' },
      { startNodeId: 'rule-1', endNodeId: 'scenario-2' },
    ]);
  }

  whenBuildingHierarchy(): void {
    this.result = this.useCase.execute(this.elements, []);
  }

  thenTheRuleHasTwoScenarioChildren(): void {
    const rule =
      this.result.businessObjectives[0].children[0].children[0].children[0]
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
  private readonly connectorReader =
    new BuildHierarchyInMemoryConnectorReader();
  private readonly useCase = new BuildHierarchyUseCase(this.connectorReader);
  private elements: BoardElement[] = [];
  private releaseAssignments: ReleaseAssignment[] = [];
  private result!: BuildHierarchyOutput;

  givenAUserStoryWithReleaseAndChildren(): void {
    this.elements = [
      BoardElement.create('obj-1', ElementType.OBJECTIVE, 'Objective'),
      BoardElement.create('actor-1', ElementType.ACTOR, 'Actor'),
      BoardElement.create('impact-1', ElementType.IMPACT, 'Impact'),
      BoardElement.create('action-1', ElementType.ACTION, 'Action'),
      BoardElement.create('story-1', ElementType.USER_STORY, 'Story'),
      BoardElement.create('rule-1', ElementType.RULE, 'Rule'),
      BoardElement.create('scenario-1', ElementType.SCENARIO, 'Scenario'),
    ];
    this.connectorReader.feedConnectors([
      { startNodeId: 'obj-1', endNodeId: 'actor-1' },
      { startNodeId: 'actor-1', endNodeId: 'impact-1' },
      { startNodeId: 'impact-1', endNodeId: 'action-1' },
      { startNodeId: 'action-1', endNodeId: 'story-1' },
      { startNodeId: 'story-1', endNodeId: 'rule-1' },
      { startNodeId: 'rule-1', endNodeId: 'scenario-1' },
    ]);
    this.releaseAssignments = [
      { elementId: 'story-1', release: 'MVP' },
    ];
  }

  whenBuildingHierarchy(): void {
    this.result = this.useCase.execute(this.elements, this.releaseAssignments);
  }

  thenReleaseIsPropagatedToChildren(): void {
    const story =
      this.result.businessObjectives[0].children[0].children[0].children[0]
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
  private readonly connectorReader =
    new BuildHierarchyInMemoryConnectorReader();
  private readonly useCase = new BuildHierarchyUseCase(this.connectorReader);
  private elements: BoardElement[] = [];
  private result!: BuildHierarchyOutput;

  givenElementsWithAndWithoutConnectors(): void {
    this.elements = [
      BoardElement.create('obj-1', ElementType.OBJECTIVE, 'Connected objective'),
      BoardElement.create('actor-1', ElementType.ACTOR, 'Connected actor'),
      BoardElement.create('obj-2', ElementType.OBJECTIVE, 'Orphan objective'),
      BoardElement.create('actor-2', ElementType.ACTOR, 'Orphan actor'),
      BoardElement.create('impact-solo', ElementType.IMPACT, 'Orphan impact'),
    ];
    this.connectorReader.feedConnectors([
      { startNodeId: 'obj-1', endNodeId: 'actor-1' },
    ]);
  }

  whenBuildingHierarchy(): void {
    this.result = this.useCase.execute(this.elements, []);
  }

  thenOnlyConnectedElementsAreInTheHierarchy(): void {
    expect(this.result.businessObjectives).toHaveLength(1);
    expect(this.result.businessObjectives[0].id).toBe('obj-1');
    expect(this.result.businessObjectives[0].children).toHaveLength(1);
    expect(this.result.businessObjectives[0].children[0].id).toBe('actor-1');
  }
}

export class FullIntegrationDriver implements FullIntegrationDsl {
  private readonly connectorReader =
    new BuildHierarchyInMemoryConnectorReader();
  private readonly useCase = new BuildHierarchyUseCase(this.connectorReader);
  private elements: BoardElement[] = [];
  private releaseAssignments: ReleaseAssignment[] = [];
  private result!: BuildHierarchyOutput;

  givenTheCompleteImpactMappingBoard(): void {
    this.elements = [
      BoardElement.create(
        'obj-1',
        ElementType.OBJECTIVE,
        'Améliorer la qualité globale du delivery pendant les ateliers',
      ),
      BoardElement.create('actor-1', ElementType.ACTOR, 'Product Owner'),
      BoardElement.create(
        'impact-1',
        ElementType.IMPACT,
        'Identifier et rendre explicites les zones de flou',
      ),
      BoardElement.create(
        'action-1',
        ElementType.ACTION,
        'Challenger les user stories et règles pendant l\'atelier',
      ),
      BoardElement.create(
        'story-1',
        ElementType.USER_STORY,
        'En tant que Product Owner, je veux identifier les règles floues afin de clarifier les décisions produit',
      ),
      BoardElement.create(
        'rule-1',
        ElementType.RULE,
        'Les règles métier doivent être explicites et testables',
      ),
      BoardElement.create(
        'scenario-1',
        ElementType.SCENARIO,
        'Si une règle métier est ambiguë, elle doit être signalée et discutée pendant l\'atelier afin de lever toute interprétation.',
      ),
      BoardElement.create(
        'scenario-2',
        ElementType.SCENARIO,
        'Si plusieurs interprétations sont possibles pour une règle, le système doit générer une question de clarification.',
      ),
    ];
    this.connectorReader.feedConnectors([
      { startNodeId: 'obj-1', endNodeId: 'actor-1' },
      { startNodeId: 'actor-1', endNodeId: 'impact-1' },
      { startNodeId: 'impact-1', endNodeId: 'action-1' },
      { startNodeId: 'action-1', endNodeId: 'story-1' },
      { startNodeId: 'story-1', endNodeId: 'rule-1' },
      { startNodeId: 'rule-1', endNodeId: 'scenario-1' },
      { startNodeId: 'rule-1', endNodeId: 'scenario-2' },
    ]);
    this.releaseAssignments = [
      { elementId: 'story-1', release: 'MVP' },
    ];
  }

  whenBuildingHierarchy(): void {
    this.result = this.useCase.execute(this.elements, this.releaseAssignments);
  }

  thenTheExpectedJsonIsProduced(): void {
    expect(this.result.businessObjectives).toHaveLength(1);

    const obj = this.result.businessObjectives[0];
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
