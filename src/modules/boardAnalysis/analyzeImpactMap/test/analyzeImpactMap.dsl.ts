export interface DetectsObjectiveByColorDsl {
  givenABoardWithAnObjectiveShape(): void;
  whenAnalyzingImpactMap(): void;
  thenOneObjectiveElementIsDetected(): void;
}

export interface DetectsAllTypesByColorDsl {
  givenABoardWithOneShapePerType(): void;
  whenAnalyzingImpactMap(): void;
  thenAllTypesAreDetected(): void;
}

export interface IgnoresUnknownColorDsl {
  givenABoardWithAnUnknownColorShape(): void;
  whenAnalyzingImpactMap(): void;
  thenNoElementIsDetected(): void;
}

export interface IgnoresEmptyTextDsl {
  givenABoardWithAnEmptyTextShape(): void;
  whenAnalyzingImpactMap(): void;
  thenNoElementIsDetected(): void;
}

export interface IgnoresNonRectangleShapesDsl {
  givenABoardWithNonRectangleShapes(): void;
  whenAnalyzingImpactMap(): void;
  thenNoElementIsDetected(): void;
}

export interface DetectsReleaseSectionDsl {
  givenASectionAndAnElementInsideIt(): void;
  whenAnalyzingImpactMap(): void;
  thenTheElementIsAssignedToTheRelease(): void;
}

export interface IgnoresSectionsWithEmptyNameDsl {
  givenASectionWithEmptyNameAndAnElementInsideIt(): void;
  whenAnalyzingImpactMap(): void;
  thenNoReleaseIsAssigned(): void;
}

export interface BuildsLinearHierarchyDsl {
  givenALinearChainOfElements(): void;
  whenAnalyzingImpactMap(): void;
  thenALinearHierarchyIsProduced(): void;
}

export interface HandlesMultipleChildrenDsl {
  givenARuleWithTwoScenarios(): void;
  whenAnalyzingImpactMap(): void;
  thenTheRuleHasTwoScenarioChildren(): void;
}

export interface AssignsAndPropagatesReleaseDsl {
  givenAUserStoryWithReleaseAndChildren(): void;
  whenAnalyzingImpactMap(): void;
  thenReleaseIsPropagatedToChildren(): void;
}

export interface ExcludesShapesWithoutConnectorDsl {
  givenElementsWithAndWithoutConnectors(): void;
  whenAnalyzingImpactMap(): void;
  thenOnlyConnectedElementsAreInTheHierarchy(): void;
}

export interface FullIntegrationDsl {
  givenTheCompleteImpactMappingBoard(): void;
  whenAnalyzingImpactMap(): void;
  thenTheExpectedJsonIsProduced(): void;
}
