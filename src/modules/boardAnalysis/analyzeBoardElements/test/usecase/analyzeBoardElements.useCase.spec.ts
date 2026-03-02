import { describe, test } from 'vitest';
import {
  DetectsObjectiveByColorDriver,
  DetectsAllTypesByColorDriver,
  IgnoresUnknownColorDriver,
  IgnoresEmptyTextDriver,
  IgnoresNonRectangleShapesDriver,
} from './analyzeBoardElements.useCaseDriver';

describe('AnalyzeBoardElements use case', () => {
  test('detects an objective shape by its blue color', () => {
    const driver = new DetectsObjectiveByColorDriver();
    driver.givenABoardWithAnObjectiveShape();
    driver.whenAnalyzingBoardElements();
    driver.thenOneObjectiveElementIsDetected();
  });

  test('detects all element types by their colors', () => {
    const driver = new DetectsAllTypesByColorDriver();
    driver.givenABoardWithOneShapePerType();
    driver.whenAnalyzingBoardElements();
    driver.thenAllTypesAreDetected();
  });

  test('ignores shapes with unknown color', () => {
    const driver = new IgnoresUnknownColorDriver();
    driver.givenABoardWithAnUnknownColorShape();
    driver.whenAnalyzingBoardElements();
    driver.thenNoElementIsDetected();
  });

  test('ignores shapes with empty text', () => {
    const driver = new IgnoresEmptyTextDriver();
    driver.givenABoardWithAnEmptyTextShape();
    driver.whenAnalyzingBoardElements();
    driver.thenNoElementIsDetected();
  });

  test('ignores non-rectangle shapes', () => {
    const driver = new IgnoresNonRectangleShapesDriver();
    driver.givenABoardWithNonRectangleShapes();
    driver.whenAnalyzingBoardElements();
    driver.thenNoElementIsDetected();
  });
});
