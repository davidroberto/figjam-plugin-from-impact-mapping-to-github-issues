import { AnalyzeBoardElementsFigmaBoardReader } from './modules/boardAnalysis/analyzeBoardElements/analyzeBoardElements.figmaBoardReader';
import { AnalyzeBoardElementsFigmaPositionReader } from './modules/boardAnalysis/analyzeBoardElements/analyzeBoardElements.figmaPositionReader';
import { AnalyzeBoardElementsUseCase } from './modules/boardAnalysis/analyzeBoardElements/analyzeBoardElements.useCase';
import { BuildHierarchyFigmaConnectorReader } from './modules/boardAnalysis/buildHierarchy/buildHierarchy.figmaConnectorReader';
import { BuildHierarchyUseCase } from './modules/boardAnalysis/buildHierarchy/buildHierarchy.useCase';
import { DetectReleasesFigmaSectionReader } from './modules/boardAnalysis/detectReleases/detectReleases.figmaSectionReader';
import { DetectReleasesUseCase } from './modules/boardAnalysis/detectReleases/detectReleases.useCase';

const boardReader = new AnalyzeBoardElementsFigmaBoardReader();
const positionReader = new AnalyzeBoardElementsFigmaPositionReader();
const sectionReader = new DetectReleasesFigmaSectionReader();
const connectorReader = new BuildHierarchyFigmaConnectorReader();

const analyzeBoardElements = new AnalyzeBoardElementsUseCase(boardReader);
const detectReleases = new DetectReleasesUseCase(sectionReader);
const buildHierarchy = new BuildHierarchyUseCase(connectorReader);

const elements = analyzeBoardElements.execute();
const positions = positionReader.readAllPositions();
const releaseAssignments = detectReleases.execute(elements, positions);
const hierarchy = buildHierarchy.execute(elements, releaseAssignments);

const json = JSON.stringify(hierarchy, null, 2);
console.log(json);
figma.notify('Impact mapping analysis complete. Check console for JSON output.');
figma.closePlugin();
