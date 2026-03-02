import { ShapeBounds } from './shapeBounds';

export enum ElementType {
  OBJECTIVE = 'OBJECTIVE',
  ACTOR = 'ACTOR',
  IMPACT = 'IMPACT',
  ACTION = 'ACTION',
  USER_STORY = 'USER_STORY',
  RULE = 'RULE',
  SCENARIO = 'SCENARIO',
}

const VALID_SHAPE_TYPES = ['SQUARE', 'ROUNDED_RECTANGLE'];

const HIERARCHY_ORDER: ElementType[] = [
  ElementType.OBJECTIVE,
  ElementType.ACTOR,
  ElementType.IMPACT,
  ElementType.ACTION,
  ElementType.USER_STORY,
  ElementType.RULE,
  ElementType.SCENARIO,
];

const COLOR_TO_TYPE: Record<string, ElementType> = {
  '#1E3A8A': ElementType.OBJECTIVE,
  '#7C3AED': ElementType.ACTOR,
  '#16A34A': ElementType.IMPACT,
  '#EA580C': ElementType.ACTION,
  '#FACC15': ElementType.USER_STORY,
  '#64748B': ElementType.RULE,
  '#CBD5E1': ElementType.SCENARIO,
};

export class Element {
  readonly id: string;
  readonly type: ElementType;
  readonly text: string;
  release?: string;
  bounds?: ShapeBounds;

  private constructor(id: string, type: ElementType, text: string) {
    this.id = id;
    this.type = type;
    this.text = text;
  }

  static generateFromRawShape(shape: {
    id: string;
    shapeType: string;
    fillColor: string;
    text: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  }): Element | undefined {
    if (!VALID_SHAPE_TYPES.includes(shape.shapeType)) return undefined;
    if (shape.text.trim().length === 0) return undefined;
    const type = COLOR_TO_TYPE[shape.fillColor.toUpperCase()];
    if (!type) return undefined;

    const element = new Element(shape.id, type, shape.text);
    if (
      shape.x !== undefined &&
      shape.y !== undefined &&
      shape.width !== undefined &&
      shape.height !== undefined
    ) {
      element.bounds = ShapeBounds.locateShape(shape.x, shape.y, shape.width, shape.height);
    }
    return element;
  }

  private getHierarchyLevel(): number {
    return HIERARCHY_ORDER.indexOf(this.type);
  }

  isDirectParentOf(child: Element): boolean {
    return child.getHierarchyLevel() - this.getHierarchyLevel() === 1;
  }

  title(): string {
    if (this.type === ElementType.SCENARIO) {
      const firstLine = this.text.trim().split('\n')[0].trim();
      if (firstLine.toLowerCase().startsWith('si ')) return 'Cas nominal';
      return firstLine || 'Scenario';
    }
    return this.text;
  }

  isObjective(): boolean {
    return this.type === ElementType.OBJECTIVE;
  }

  isScenario(): boolean {
    return this.type === ElementType.SCENARIO;
  }
}
