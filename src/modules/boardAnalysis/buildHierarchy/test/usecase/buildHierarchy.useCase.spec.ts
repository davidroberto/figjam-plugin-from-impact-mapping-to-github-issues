import { describe, test } from 'vitest';
import {
  BuildsLinearHierarchyDriver,
  HandlesMultipleChildrenDriver,
  AssignsAndPropagatesReleaseDriver,
  ExcludesShapesWithoutConnectorDriver,
  FullIntegrationDriver,
} from './buildHierarchy.useCaseDriver';

describe('BuildHierarchy use case', () => {
  test('builds a linear hierarchy from objective to impact', () => {
    const driver = new BuildsLinearHierarchyDriver();
    driver.givenALinearChainOfElements();
    driver.whenBuildingHierarchy();
    driver.thenALinearHierarchyIsProduced();
  });

  test('handles a rule with multiple scenario children', () => {
    const driver = new HandlesMultipleChildrenDriver();
    driver.givenARuleWithTwoScenarios();
    driver.whenBuildingHierarchy();
    driver.thenTheRuleHasTwoScenarioChildren();
  });

  test('assigns release to user story and propagates to children', () => {
    const driver = new AssignsAndPropagatesReleaseDriver();
    driver.givenAUserStoryWithReleaseAndChildren();
    driver.whenBuildingHierarchy();
    driver.thenReleaseIsPropagatedToChildren();
  });

  test('excludes shapes that have no connector', () => {
    const driver = new ExcludesShapesWithoutConnectorDriver();
    driver.givenElementsWithAndWithoutConnectors();
    driver.whenBuildingHierarchy();
    driver.thenOnlyConnectedElementsAreInTheHierarchy();
  });

  test('full integration: produces the expected JSON from complete board', () => {
    const driver = new FullIntegrationDriver();
    driver.givenTheCompleteImpactMappingBoard();
    driver.whenBuildingHierarchy();
    driver.thenTheExpectedJsonIsProduced();
  });
});
