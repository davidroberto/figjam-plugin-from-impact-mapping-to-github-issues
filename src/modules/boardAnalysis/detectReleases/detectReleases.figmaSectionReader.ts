import type { RawSection } from '../rawTypes';
import type { DetectReleasesSectionReader } from './detectReleases.sectionReader';

export class DetectReleasesFigmaSectionReader
  implements DetectReleasesSectionReader
{
  readAllSections(): RawSection[] {
    const sections = figma.currentPage.findAll(
      (node) => node.type === 'SECTION',
    ) as SectionNode[];

    return sections.map((section) => ({
      name: section.name,
      x: section.x,
      y: section.y,
      width: section.width,
      height: section.height,
    }));
  }
}
