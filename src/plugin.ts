import { AnalyzeImpactMapFigmaBoardReader } from './modules/boardAnalysis/analyzeImpactMap/analyzeImpactMap.figmaBoardReader';
import { AnalyzeImpactMapUseCase } from './modules/boardAnalysis/analyzeImpactMap/analyzeImpactMap.useCase';

const boardReader = new AnalyzeImpactMapFigmaBoardReader();
const analyzeImpactMap = new AnalyzeImpactMapUseCase(boardReader);

const result = analyzeImpactMap.execute();

const json = JSON.stringify(result, null, 2);
console.log(json);
figma.notify('Impact mapping analysis complete. Check console for JSON output.');
figma.closePlugin();
