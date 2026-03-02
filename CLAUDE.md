# CLAUDE.md — FigJam Impact Mapping to GitHub Issues

## Project Stack

- Plugin FigJam (TypeScript)
- Build: esbuild (bundle → `dist/code.js`)
- Tests: Vitest
- Typings: `@figma/plugin-typings`
- Language: TypeScript strict. Do NOT use JavaScript.
- Always update CLAUDE.md after implementing significant architectural changes or new conventions.

---

## Workflow Discipline

- When the user gives a plan or a command reference, follow it literally. Do NOT scan/explore the codebase as a substitute for reading the provided instructions.
- Produce code, not just plans, unless explicitly asked for a plan.
- Do NOT ask clarification questions when the answer is available in the provided context, CLAUDE.md, or command files. Act on what you know.
- When interrupted or corrected, immediately adjust — do not continue the previous approach.

---

## Projet

Plugin FigJam qui analyse un board d'impact mapping (shapes colorés, connecteurs directionnels, sections) et produit un JSON hiérarchique structuré pour transformer un atelier en backlog GitHub.

---

## Installation

```bash
npm install
```

## Scripts

```bash
npm run build          # esbuild → dist/code.js
npm run test:unit      # vitest run
npm run test:watch     # vitest (watch mode)
```

---

## Architecture

### Principe clé

Séparer la logique métier pure (TypeScript) de l'API FigJam (infrastructure). L'API Figma est un adaptateur, jamais importée dans le domaine. Le domaine est modélisé en DDD avec des entités riches, value objects et un aggregate root.

### Structure des fichiers

```
src/
├── plugin.ts                              # Entry point (orchestre le use case unique)
├── modules/
│   ├── boardAnalysis/
│   │   ├── elementType.ts                 # Enum des types (enum seulement)
│   │   ├── elementColor.ts                # Value object (color mapping + RGB→hex)
│   │   ├── shapeBounds.ts                 # Value object (bounds + containment géométrique)
│   │   ├── boardElement.ts                # Entité riche (hierarchy, release, title, validation)
│   │   ├── releaseSection.ts              # Value object (section + validité + containment)
│   │   ├── hierarchyNode.ts               # Entité (tree node + propagation release)
│   │   ├── impactMap.ts                   # Aggregate root (assignReleases + buildHierarchy)
│   │   ├── rawTypes.ts                    # RawBoardShape, RawConnector, RawSection (DTOs)
│   │   └── analyzeImpactMap/
│   │       ├── analyzeImpactMap.useCase.ts           # Use case unique — orchestrateur fin
│   │       ├── analyzeImpactMap.boardReader.ts       # Port unique (interface)
│   │       ├── analyzeImpactMap.figmaBoardReader.ts  # Adaptateur Figma unique
│   │       └── test/
│   │           ├── analyzeImpactMap.dsl.ts
│   │           ├── analyzeImpactMap.inMemoryBoardReader.ts
│   │           └── usecase/
│   │               ├── analyzeImpactMap.useCase.spec.ts
│   │               └── analyzeImpactMap.useCaseDriver.ts
│   └── shared/
│       └── result/
│           └── commandResult.ts                       # CommandResult<E>
```

### Injection de dépendances

Pas de framework DI — les use cases sont des classes pures, injectées via constructeur.

---

## Principes d'architecture

### DDD / Clean Architecture / Ports & Adapters

- **Value Objects** : `ElementColor`, `ShapeBounds`, `ReleaseSection` — classes avec `private constructor` + factory statique. Logique métier encapsulée.
- **Entités** : `BoardElement` (riche, avec hierarchy level, validation, release, bounds), `HierarchyNode` (arbre + propagation release). Classes avec `private constructor` + factory.
- **Aggregate Root** : `ImpactMap` — orchestre `assignReleases()` et `buildHierarchy()`. Point d'entrée unique pour la logique métier.
- **Use Case** : `AnalyzeImpactMapUseCase` — orchestrateur fin, lit les données brutes, crée les objets domaine, assemble l'aggregate.
- **Port** : `AnalyzeImpactMapBoardReader` — interface unique pour lire toutes les données du board.
- **Adapter** : `AnalyzeImpactMapFigmaBoardReader` (prod), `AnalyzeImpactMapInMemoryBoardReader` (tests).

### Logique métier dans le domaine

- La hiérarchie (parent-child validation) vit dans `BoardElement.isDirectParentOf()`
- Le containment géométrique vit dans `ShapeBounds.isContainedIn()`
- La propagation des releases vit dans `HierarchyNode.propagateRelease()`
- L'assignation des releases vit dans `ImpactMap.assignReleases()`
- La construction de l'arbre vit dans `ImpactMap.buildHierarchy()`
- Le mapping couleur → type vit dans `ElementColor.toElementType()`
- La validation des shapes vit dans `BoardElement.isValidShape()`
- L'extraction du titre scénario vit dans `BoardElement.title` (getter)

---

## Conventions

### Nommage des fichiers

| Fichier | Convention |
|---------|-----------|
| Use case | `{feature}.useCase.ts` |
| Interface port | `{feature}.{portName}.ts` |
| Adaptateur Figma | `{feature}.figma{PortName}.ts` |
| Adaptateur In-Memory | `{feature}.inMemory{PortName}.ts` |
| DSL test | `{feature}.dsl.ts` |
| Entité domaine | `{entity}.ts` |
| Value object | `{valueObject}.ts` |
| Aggregate root | `{aggregate}.ts` |

### Tests — Pattern DSL / Driver / Spec

| Niveau | Fichiers | Environnement |
|--------|----------|---------------|
| **Unit (use case)** | `test/usecase/{feature}.useCase.spec.ts` + `useCaseDriver.ts` | In-memory, pas d'IO |

**Pas de tests unitaires pour le domaine** — toute la logique domaine est couverte indirectement par les tests de use case.

**DSL** : une interface par scénario dans `test/{feature}.dsl.ts`.

**Driver** : une classe par scénario, implémente l'interface DSL. Contient le setup (Given), l'action (When), les assertions (Then).

**Spec** : instancie le driver, appelle les méthodes Given/When/Then dans l'ordre. Pas de logique dans le spec.

```typescript
test('nom du scénario', async () => {
  const driver = new ScenarioNameDriver();
  await driver.givenSomeContext();
  await driver.whenSomethingHappens();
  await driver.thenExpectedOutcome();
});
```

### Commits

- Format : `{type}: {description}`
- Types : `feat`, `tech`, `fix`
- Co-author obligatoire : `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`

### Code style

- `singleQuote: true`, `trailingComma: all`
- Pas de `any` explicite (`strict: true`)
- Pas de barrel files (`index.ts`) — imports directs vers le fichier source

---

## Détails techniques — Impact Mapping

### Couleurs des types

| Type | Hex |
|------|-----|
| OBJECTIVE | `#1E3A8A` |
| ACTOR | `#7C3AED` |
| IMPACT | `#16A34A` |
| ACTION | `#EA580C` |
| USER_STORY | `#FACC15` |
| RULE | `#64748B` |
| SCENARIO | `#CBD5E1` |

### Hiérarchie stricte

`OBJECTIVE → ACTOR → IMPACT → ACTION → USER_STORY → RULE → SCENARIO`

Un connecteur est valide seulement si le type parent est exactement un niveau au-dessus du type enfant. Validé par `BoardElement.isDirectParentOf()`.

### Shapes valides

- `ShapeWithTextNode` avec `shapeType` = `SQUARE` ou `ROUNDED_RECTANGLE`
- Texte non vide obligatoire
- Couleur connue obligatoire
- Validé par `BoardElement.isValidShape()`

### Couleurs Figma

- Stockées en float 0-1 (`{ r, g, b }`). Conversion via `ElementColor.fromRgb()`.
- Comparaison en uppercase.

### Sections / Releases

- Les releases sont des `SectionNode` FigJam, modélisées par `ReleaseSection`
- Section avec nom non vide = release valide (`ReleaseSection.isValid`)
- Containment : centre du shape dans les bounds de la section (`ShapeBounds.isContainedIn()`)

### Propagation des releases

- Une user story dans une section reçoit la release
- Ses enfants (rules, scenarios) héritent de la release du parent
- Propagation via `HierarchyNode.propagateRelease()`

---

## Vérification obligatoire après modification — OBLIGATOIRE

```bash
npm run test:unit    # Tous les tests passent
npm run build        # Bundle produit dist/code.js sans erreur
```

---

## Apprentissage continu — OBLIGATOIRE

Après CHAQUE correction ou retour de l'utilisateur, mettre à jour ce CLAUDE.md si nécessaire.
