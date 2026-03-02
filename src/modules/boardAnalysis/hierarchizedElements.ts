import type { Element, ElementType } from './element';
import type { RawConnector } from './analyzeImpactMap/analyzeImpactMap.boardReader';

type HierarchizedElement = {
  id: string;
  type: ElementType;
  title: string;
  parentId?: string;
  text?: string;
  children: HierarchizedElement[];
  release?: string;
};

export type HierarchizedElementJson = {
  id: string;
  type: ElementType;
  title: string;
  parentId?: string;
  release?: string;
  text?: string;
  children: HierarchizedElementJson[];
};

export class HierarchizedElements {
  private readonly roots: HierarchizedElement[];

  private constructor(roots: HierarchizedElement[]) {
    this.roots = roots;
  }

  static fromNonHierarchizedElementsAndConnectors(
    elements: Element[],
    connectors: RawConnector[],
  ): HierarchizedElements {
    const elementMap = new Map(elements.map((el) => [el.id, el]));
    const childToParent = new Map<string, string>();
    const connectedIds = new Set<string>();

    for (const connector of connectors) {
      const parent = elementMap.get(connector.startNodeId);
      const child = elementMap.get(connector.endNodeId);
      if (!parent || !child) continue;
      if (!parent.isDirectParentOf(child)) continue;
      childToParent.set(child.id, parent.id);
      connectedIds.add(parent.id);
      connectedIds.add(child.id);
    }

    const connectedElements = elements.filter((el) =>
      connectedIds.has(el.id),
    );

    const buildNode = (
      element: Element,
      parentId?: string,
    ): HierarchizedElement => {
      const node: HierarchizedElement = {
        id: element.id,
        type: element.type,
        title: element.title(),
        parentId,
        release: element.release,
        text: element.isScenario() ? element.text : undefined,
        children: [],
      };

      connectedElements
        .filter((el) => childToParent.get(el.id) === element.id)
        .forEach((el) => node.children.push(buildNode(el, element.id)));

      return node;
    };

    const propagateRelease = (node: HierarchizedElement, parentRelease?: string): void => {
      if (!node.release && parentRelease) {
        node.release = parentRelease;
      }
      for (const child of node.children) {
        propagateRelease(child, node.release);
      }
    };

    const roots = connectedElements
      .filter((el) => el.isObjective())
      .filter((el) => !childToParent.has(el.id))
      .map((el) => buildNode(el));

    for (const root of roots) {
      propagateRelease(root);
    }

    return new HierarchizedElements(roots);
  }

  toJson(): HierarchizedElementJson[] {
    const nodeToJson = (node: HierarchizedElement): HierarchizedElementJson => {
      const json: HierarchizedElementJson = {
        id: node.id,
        type: node.type,
        title: node.title,
        children: node.children.map((c) => nodeToJson(c)),
      };
      if (node.parentId) json.parentId = node.parentId;
      if (node.release) json.release = node.release;
      if (node.text) json.text = node.text;
      return json;
    };

    return this.roots.map((r) => nodeToJson(r));
  }
}
