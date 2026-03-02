import { ElementType } from './elementType';

const COLOR_TO_TYPE: Record<string, ElementType> = {
  '#1E3A8A': ElementType.OBJECTIVE,
  '#7C3AED': ElementType.ACTOR,
  '#16A34A': ElementType.IMPACT,
  '#EA580C': ElementType.ACTION,
  '#FACC15': ElementType.USER_STORY,
  '#64748B': ElementType.RULE,
  '#CBD5E1': ElementType.SCENARIO,
};

export function getElementTypeFromColor(
  hexColor: string,
): ElementType | undefined {
  return COLOR_TO_TYPE[hexColor.toUpperCase()];
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (v: number) =>
    Math.round(v * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}
