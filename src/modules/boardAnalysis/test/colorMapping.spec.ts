import { describe, test, expect } from 'vitest';
import { rgbToHex, getElementTypeFromColor } from '../colorMapping';
import { ElementType } from '../elementType';

describe('colorMapping', () => {
  describe('rgbToHex', () => {
    test('converts Figma RGB float (0-1) to uppercase hex', () => {
      // #1E3A8A = rgb(30, 58, 138) => float (0.1176, 0.2275, 0.5412)
      expect(rgbToHex(30 / 255, 58 / 255, 138 / 255)).toBe('#1E3A8A');
    });

    test('converts black', () => {
      expect(rgbToHex(0, 0, 0)).toBe('#000000');
    });

    test('converts white', () => {
      expect(rgbToHex(1, 1, 1)).toBe('#FFFFFF');
    });
  });

  describe('getElementTypeFromColor', () => {
    test('returns OBJECTIVE for blue', () => {
      expect(getElementTypeFromColor('#1E3A8A')).toBe(ElementType.OBJECTIVE);
    });

    test('is case-insensitive', () => {
      expect(getElementTypeFromColor('#1e3a8a')).toBe(ElementType.OBJECTIVE);
    });

    test('returns undefined for unknown color', () => {
      expect(getElementTypeFromColor('#FF0000')).toBeUndefined();
    });
  });
});
