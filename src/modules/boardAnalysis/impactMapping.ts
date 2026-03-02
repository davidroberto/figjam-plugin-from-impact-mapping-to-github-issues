import { Element } from './element';
import { Release } from './release';
import { HierarchizedElements, type HierarchizedElementJson } from './hierarchizedElements';
import type { RawShapeWithBounds, RawSectionData, RawConnector } from './analyzeImpactMap/analyzeImpactMap.boardReader';

export type ImpactMappingJson = {
  hierarchizedElements: HierarchizedElementJson[];
};

export class ImpactMapping {
  private readonly hierarchizedElements: HierarchizedElements;

  private constructor(hierarchizedElements: HierarchizedElements) {
    this.hierarchizedElements = hierarchizedElements;
  }

  static generateFromBoard(
    shapes: RawShapeWithBounds[],
    connectors: RawConnector[],
    rawSections: RawSectionData[],
  ): ImpactMapping {

    const elements = shapes
      .map((shape) => Element.generateFromRawShape(shape))
      .filter((element): element is Element => element !== undefined);

    for (const section of rawSections) {
      Release.identifyFromSection(section).assignToItems(elements);
    }

    const hierarchizedElements = HierarchizedElements.fromNonHierarchizedElementsAndConnectors(elements, connectors);

    return new ImpactMapping(hierarchizedElements);
  }

  toJson(): ImpactMappingJson {
    return {
      hierarchizedElements: this.hierarchizedElements.toJson(),
    };
  }
}
