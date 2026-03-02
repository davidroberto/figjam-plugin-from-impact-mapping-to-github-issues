export interface BuildsLinearHierarchyDsl {
  givenALinearChainOfElements(): void;
  whenBuildingHierarchy(): void;
  thenALinearHierarchyIsProduced(): void;
}

export interface HandlesMultipleChildrenDsl {
  givenARuleWithTwoScenarios(): void;
  whenBuildingHierarchy(): void;
  thenTheRuleHasTwoScenarioChildren(): void;
}

export interface AssignsAndPropagatesReleaseDsl {
  givenAUserStoryWithReleaseAndChildren(): void;
  whenBuildingHierarchy(): void;
  thenReleaseIsPropagatedToChildren(): void;
}

export interface ExcludesShapesWithoutConnectorDsl {
  givenElementsWithAndWithoutConnectors(): void;
  whenBuildingHierarchy(): void;
  thenOnlyConnectedElementsAreInTheHierarchy(): void;
}

export interface FullIntegrationDsl {
  givenTheCompleteImpactMappingBoard(): void;
  whenBuildingHierarchy(): void;
  thenTheExpectedJsonIsProduced(): void;
}
