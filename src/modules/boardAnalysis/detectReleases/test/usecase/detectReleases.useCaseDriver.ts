import { expect } from 'vitest';
import { ElementType } from '../../../elementType';
import { BoardElement } from '../../../boardElement';
import {
  DetectReleasesUseCase,
  type ReleaseAssignment,
  type ShapePosition,
} from '../../detectReleases.useCase';
import { DetectReleasesInMemorySectionReader } from '../detectReleases.inMemorySectionReader';
import type {
  DetectsReleaseSectionWithContainedElementsDsl,
  IgnoresSectionsWithEmptyNameDsl,
} from '../detectReleases.dsl';

export class DetectsReleaseSectionWithContainedElementsDriver
  implements DetectsReleaseSectionWithContainedElementsDsl
{
  private readonly sectionReader =
    new DetectReleasesInMemorySectionReader();
  private readonly useCase = new DetectReleasesUseCase(this.sectionReader);
  private elements: BoardElement[] = [];
  private positions: ShapePosition[] = [];
  private result: ReleaseAssignment[] = [];

  givenASectionAndAnElementInsideIt(): void {
    this.sectionReader.feedSections([
      { name: 'MVP', x: 0, y: 0, width: 500, height: 500 },
    ]);
    this.elements = [
      BoardElement.create('story-1', ElementType.USER_STORY, 'A user story'),
    ];
    this.positions = [
      { elementId: 'story-1', x: 100, y: 100, width: 200, height: 100 },
    ];
  }

  whenDetectingReleases(): void {
    this.result = this.useCase.execute(this.elements, this.positions);
  }

  thenTheElementIsAssignedToTheRelease(): void {
    expect(this.result).toHaveLength(1);
    expect(this.result[0].elementId).toBe('story-1');
    expect(this.result[0].release).toBe('MVP');
  }
}

export class IgnoresSectionsWithEmptyNameDriver
  implements IgnoresSectionsWithEmptyNameDsl
{
  private readonly sectionReader =
    new DetectReleasesInMemorySectionReader();
  private readonly useCase = new DetectReleasesUseCase(this.sectionReader);
  private elements: BoardElement[] = [];
  private positions: ShapePosition[] = [];
  private result: ReleaseAssignment[] = [];

  givenASectionWithEmptyNameAndAnElementInsideIt(): void {
    this.sectionReader.feedSections([
      { name: '   ', x: 0, y: 0, width: 500, height: 500 },
    ]);
    this.elements = [
      BoardElement.create('story-1', ElementType.USER_STORY, 'A user story'),
    ];
    this.positions = [
      { elementId: 'story-1', x: 100, y: 100, width: 200, height: 100 },
    ];
  }

  whenDetectingReleases(): void {
    this.result = this.useCase.execute(this.elements, this.positions);
  }

  thenNoReleaseIsAssigned(): void {
    expect(this.result).toHaveLength(0);
  }
}
