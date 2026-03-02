import type { ElementType } from './elementType';

export class BoardElement {
  readonly id: string;
  readonly type: ElementType;
  readonly text: string;

  private constructor(id: string, type: ElementType, text: string) {
    this.id = id;
    this.type = type;
    this.text = text;
  }

  static create(id: string, type: ElementType, text: string): BoardElement {
    return new BoardElement(id, type, text);
  }
}
