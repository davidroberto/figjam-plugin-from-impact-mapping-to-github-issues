export enum ElementType {
  OBJECTIVE = 'OBJECTIVE',
  ACTOR = 'ACTOR',
  IMPACT = 'IMPACT',
  ACTION = 'ACTION',
  USER_STORY = 'USER_STORY',
  RULE = 'RULE',
  SCENARIO = 'SCENARIO',
}

const HIERARCHY_ORDER: ElementType[] = [
  ElementType.OBJECTIVE,
  ElementType.ACTOR,
  ElementType.IMPACT,
  ElementType.ACTION,
  ElementType.USER_STORY,
  ElementType.RULE,
  ElementType.SCENARIO,
];

export function getHierarchyLevel(type: ElementType): number {
  return HIERARCHY_ORDER.indexOf(type);
}

export function isValidParentChild(
  parentType: ElementType,
  childType: ElementType,
): boolean {
  return getHierarchyLevel(childType) - getHierarchyLevel(parentType) === 1;
}
