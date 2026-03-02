import type { RawSection } from '../rawTypes';

export interface DetectReleasesSectionReader {
  readAllSections(): RawSection[];
}
