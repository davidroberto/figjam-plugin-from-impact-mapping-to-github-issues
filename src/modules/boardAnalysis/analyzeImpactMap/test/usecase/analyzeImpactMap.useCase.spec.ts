import { describe, test } from 'vitest';
import {
  DetectsObjectiveByColorDriver,
  DetectsAllTypesByColorDriver,
  IgnoresUnknownColorDriver,
  IgnoresEmptyTextDriver,
  IgnoresNonRectangleShapesDriver,
  DetectsReleaseSectionDriver,
  IgnoresSectionsWithEmptyNameDriver,
  BuildsLinearHierarchyDriver,
  HandlesMultipleChildrenDriver,
  AssignsAndPropagatesReleaseDriver,
  ExcludesShapesWithoutConnectorDriver,
  FullIntegrationDriver,
} from './analyzeImpactMap.useCaseDriver';

describe('AnalyzeImpactMap use case', () => {
  test('detects an objective shape by its blue color', () => {
    const driver = new DetectsObjectiveByColorDriver();
    driver.givenABoardWithAnObjectiveShape();
    driver.whenAnalyzingImpactMap();
    driver.thenOneObjectiveElementIsDetected();
  });

  test('detects all element types by their colors', () => {
    const driver = new DetectsAllTypesByColorDriver();
    driver.givenABoardWithOneShapePerType();
    driver.whenAnalyzingImpactMap();
    driver.thenAllTypesAreDetected();
  });

  test('ignores shapes with unknown color', () => {
    const driver = new IgnoresUnknownColorDriver();
    driver.givenABoardWithAnUnknownColorShape();
    driver.whenAnalyzingImpactMap();
    driver.thenNoElementIsDetected();
  });

  test('ignores shapes with empty text', () => {
    const driver = new IgnoresEmptyTextDriver();
    driver.givenABoardWithAnEmptyTextShape();
    driver.whenAnalyzingImpactMap();
    driver.thenNoElementIsDetected();
  });

  test('ignores non-rectangle shapes', () => {
    const driver = new IgnoresNonRectangleShapesDriver();
    driver.givenABoardWithNonRectangleShapes();
    driver.whenAnalyzingImpactMap();
    driver.thenNoElementIsDetected();
  });

  test('detects a release section with contained elements', () => {
    const driver = new DetectsReleaseSectionDriver();
    driver.givenASectionAndAnElementInsideIt();
    driver.whenAnalyzingImpactMap();
    driver.thenTheElementIsAssignedToTheRelease();
  });

  test('ignores sections with empty name', () => {
    const driver = new IgnoresSectionsWithEmptyNameDriver();
    driver.givenASectionWithEmptyNameAndAnElementInsideIt();
    driver.whenAnalyzingImpactMap();
    driver.thenNoReleaseIsAssigned();
  });

  test('builds a linear hierarchy from objective to impact', () => {
    const driver = new BuildsLinearHierarchyDriver();
    driver.givenALinearChainOfElements();
    driver.whenAnalyzingImpactMap();
    driver.thenALinearHierarchyIsProduced();
  });

  test('handles a rule with multiple scenario children', () => {
    const driver = new HandlesMultipleChildrenDriver();
    driver.givenARuleWithTwoScenarios();
    driver.whenAnalyzingImpactMap();
    driver.thenTheRuleHasTwoScenarioChildren();
  });

  test('assigns release to user story and propagates to children', () => {
    const driver = new AssignsAndPropagatesReleaseDriver();
    driver.givenAUserStoryWithReleaseAndChildren();
    driver.whenAnalyzingImpactMap();
    driver.thenReleaseIsPropagatedToChildren();
  });

  test('excludes shapes that have no connector', () => {
    const driver = new ExcludesShapesWithoutConnectorDriver();
    driver.givenElementsWithAndWithoutConnectors();
    driver.whenAnalyzingImpactMap();
    driver.thenOnlyConnectedElementsAreInTheHierarchy();
  });

  test('full integration: produces the expected JSON from complete board', () => {
    const driver = new FullIntegrationDriver();
    driver.givenTheCompleteImpactMappingBoard();
    driver.whenAnalyzingImpactMap();
    driver.thenTheExpectedJsonIsProduced();
  });
});
