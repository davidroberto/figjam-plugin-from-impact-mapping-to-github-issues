import { ShapeBounds } from './shapeBounds';
import type { Element } from './element';

export class Release {
  readonly releaseName: string;
  private readonly bounds: ShapeBounds;

  private constructor(name: string, bounds: ShapeBounds) {
    this.releaseName = name;
    this.bounds = bounds;
  }

  static identifyFromSection(section: {
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }): Release {
    return new Release(section.name, ShapeBounds.locateShape(section.x, section.y, section.width, section.height));
  }

  isValid(): boolean {
    return this.releaseName.trim().length > 0;
  }

  assignToItems(elements: Element[]): void {
    if (!this.isValid()) return;
    for (const element of elements) {
      if (element.bounds && element.bounds.isContainedIn(this.bounds)) {
        element.release = this.releaseName;
      }
    }
  }
}
