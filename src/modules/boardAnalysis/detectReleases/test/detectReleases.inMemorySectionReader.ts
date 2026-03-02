import type { RawSection } from '../../rawTypes';
import type { DetectReleasesSectionReader } from '../detectReleases.sectionReader';

export class DetectReleasesInMemorySectionReader
  implements DetectReleasesSectionReader
{
  private sections: RawSection[] = [];

  feedSections(sections: RawSection[]): void {
    this.sections = sections;
  }

  readAllSections(): RawSection[] {
    return this.sections;
  }
}
