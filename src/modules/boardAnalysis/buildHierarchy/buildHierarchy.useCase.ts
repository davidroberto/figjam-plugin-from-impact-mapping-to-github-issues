import type { BoardElement } from '../boardElement';
import { ElementType, isValidParentChild } from '../elementType';
import type { ReleaseAssignment } from '../detectReleases/detectReleases.useCase';
import type { HierarchyNode } from './hierarchyNode';
import type { BuildHierarchyConnectorReader } from './buildHierarchy.connectorReader';

export type BuildHierarchyOutput = {
  businessObjectives: HierarchyNode[];
};

export class BuildHierarchyUseCase {
  constructor(
    private readonly connectorReader: BuildHierarchyConnectorReader,
  ) {}

  execute(
    elements: BoardElement[],
    releaseAssignments: ReleaseAssignment[],
  ): BuildHierarchyOutput {
    const connectors = this.connectorReader.readAllConnectors();
    const elementMap = new Map(elements.map((el) => [el.id, el]));
    const releaseMap = new Map(
      releaseAssignments.map((ra) => [ra.elementId, ra.release]),
    );

    const childToParent = new Map<string, string>();
    const connectedIds = new Set<string>();

    for (const connector of connectors) {
      const parent = elementMap.get(connector.startNodeId);
      const child = elementMap.get(connector.endNodeId);
      if (!parent || !child) continue;
      if (!isValidParentChild(parent.type, child.type)) continue;
      childToParent.set(child.id, parent.id);
      connectedIds.add(parent.id);
      connectedIds.add(child.id);
    }

    const connectedElements = elements.filter((el) => connectedIds.has(el.id));

    const buildNode = (element: BoardElement, parentId?: string): HierarchyNode => {
      const directRelease = releaseMap.get(element.id);

      const children = connectedElements
        .filter((el) => childToParent.get(el.id) === element.id)
        .map((el) => buildNode(el, element.id));

      const node: HierarchyNode = {
        id: element.id,
        type: element.type,
        title: element.type === ElementType.SCENARIO ? this.extractScenarioTitle(element.text) : element.text,
        children,
      };

      if (parentId) {
        node.parentId = parentId;
      }

      if (directRelease) {
        node.release = directRelease;
      }

      if (element.type === ElementType.SCENARIO) {
        node.text = element.text;
      }

      return node;
    };

    const roots = connectedElements
      .filter((el) => el.type === ElementType.OBJECTIVE)
      .filter((el) => !childToParent.has(el.id))
      .map((el) => buildNode(el));

    this.propagateReleases(roots);

    return { businessObjectives: roots };
  }

  private extractScenarioTitle(text: string): string {
    const firstLine = text.trim().split('\n')[0].trim();
    if (firstLine.toLowerCase().startsWith('si ')) return 'Cas nominal';
    return firstLine || 'Scenario';
  }

  private propagateReleases(nodes: HierarchyNode[], parentRelease?: string): void {
    for (const node of nodes) {
      if (!node.release && parentRelease) {
        node.release = parentRelease;
      }
      this.propagateReleases(node.children, node.release);
    }
  }
}
