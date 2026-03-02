export interface DetectsReleaseSectionWithContainedElementsDsl {
  givenASectionAndAnElementInsideIt(): void;
  whenDetectingReleases(): void;
  thenTheElementIsAssignedToTheRelease(): void;
}

export interface IgnoresSectionsWithEmptyNameDsl {
  givenASectionWithEmptyNameAndAnElementInsideIt(): void;
  whenDetectingReleases(): void;
  thenNoReleaseIsAssigned(): void;
}
