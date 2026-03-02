import type { ElementType } from '../elementType';

export type HierarchyNode = {
  id: string;
  type: ElementType;
  title: string;
  parentId?: string;
  release?: string;
  text?: string;
  children: HierarchyNode[];
};
