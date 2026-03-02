export class ShapeBounds {
  private constructor(
    private readonly _x: number,
    private readonly _y: number,
    private readonly _width: number,
    private readonly _height: number,
  ) {}

  static locateShape(
    x: number,
    y: number,
    width: number,
    height: number,
  ): ShapeBounds {
    return new ShapeBounds(x, y, width, height);
  }

  isContainedIn(container: ShapeBounds): boolean {
    const centerX = this._x + this._width / 2;
    const centerY = this._y + this._height / 2;
    return (
      centerX >= container._x &&
      centerX <= container._x + container._width &&
      centerY >= container._y &&
      centerY <= container._y + container._height
    );
  }
}
