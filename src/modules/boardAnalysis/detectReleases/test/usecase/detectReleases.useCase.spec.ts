import { describe, test } from 'vitest';
import {
  DetectsReleaseSectionWithContainedElementsDriver,
  IgnoresSectionsWithEmptyNameDriver,
} from './detectReleases.useCaseDriver';

describe('DetectReleases use case', () => {
  test('detects a release section with contained elements', () => {
    const driver = new DetectsReleaseSectionWithContainedElementsDriver();
    driver.givenASectionAndAnElementInsideIt();
    driver.whenDetectingReleases();
    driver.thenTheElementIsAssignedToTheRelease();
  });

  test('ignores sections with empty name', () => {
    const driver = new IgnoresSectionsWithEmptyNameDriver();
    driver.givenASectionWithEmptyNameAndAnElementInsideIt();
    driver.whenDetectingReleases();
    driver.thenNoReleaseIsAssigned();
  });
});
