import type { BoardElement } from '../boardElement';
import type { RawSection } from '../rawTypes';
import type { DetectReleasesSectionReader } from './detectReleases.sectionReader';

export type ReleaseAssignment = {
  elementId: string;
  release: string;
};

export type ShapePosition = {
  elementId: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

function isContainedInSection(
  position: ShapePosition,
  section: RawSection,
): boolean {
  const centerX = position.x + position.width / 2;
  const centerY = position.y + position.height / 2;
  return (
    centerX >= section.x &&
    centerX <= section.x + section.width &&
    centerY >= section.y &&
    centerY <= section.y + section.height
  );
}

export class DetectReleasesUseCase {
  constructor(private readonly sectionReader: DetectReleasesSectionReader) {}

  execute(
    elements: BoardElement[],
    positions: ShapePosition[],
  ): ReleaseAssignment[] {
    const sections = this.sectionReader
      .readAllSections()
      .filter((s) => s.name.trim().length > 0);

    const assignments: ReleaseAssignment[] = [];

    for (const position of positions) {
      const element = elements.find((el) => el.id === position.elementId);
      if (!element) continue;

      for (const section of sections) {
        if (isContainedInSection(position, section)) {
          assignments.push({
            elementId: element.id,
            release: section.name,
          });
          break;
        }
      }
    }

    return assignments;
  }
}
