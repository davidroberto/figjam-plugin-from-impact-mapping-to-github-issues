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

Séparer la logique métier pure (TypeScript) de l'API FigJam (infrastructure). L'API Figma est un adaptateur, jamais importée dans le domaine.

### Structure des fichiers

```
src/
├── plugin.ts                              # Entry point (orchestre les use cases)
├── modules/
│   ├── boardAnalysis/
│   │   ├── elementType.ts                 # Enum des types
│   │   ├── colorMapping.ts                # Hex color <-> ElementType + figmaColorConverter
│   │   ├── boardElement.ts                # Entité BoardElement
│   │   ├── rawTypes.ts                    # RawBoardShape, RawConnector, RawSection (value objects)
│   │   ├── analyzeBoardElements/
│   │   │   ├── analyzeBoardElements.useCase.ts
│   │   │   ├── analyzeBoardElements.boardReader.ts    # Port (interface)
│   │   │   ├── analyzeBoardElements.figmaBoardReader.ts  # Adaptateur Figma
│   │   │   └── test/
│   │   │       ├── analyzeBoardElements.dsl.ts
│   │   │       ├── analyzeBoardElements.inMemoryBoardReader.ts
│   │   │       └── usecase/
│   │   │           ├── analyzeBoardElements.useCase.spec.ts
│   │   │           └── analyzeBoardElements.useCaseDriver.ts
│   │   ├── detectReleases/
│   │   │   ├── detectReleases.useCase.ts
│   │   │   ├── detectReleases.sectionReader.ts        # Port (interface)
│   │   │   ├── detectReleases.figmaSectionReader.ts   # Adaptateur Figma
│   │   │   └── test/
│   │   │       ├── detectReleases.dsl.ts
│   │   │       ├── detectReleases.inMemorySectionReader.ts
│   │   │       └── usecase/
│   │   │           ├── detectReleases.useCase.spec.ts
│   │   │           └── detectReleases.useCaseDriver.ts
│   │   └── buildHierarchy/
│   │       ├── buildHierarchy.useCase.ts
│   │       ├── buildHierarchy.connectorReader.ts      # Port (interface)
│   │       ├── buildHierarchy.figmaConnectorReader.ts # Adaptateur Figma
│   │       ├── hierarchyNode.ts                       # Entité HierarchyNode (arbre)
│   │       └── test/
│   │           ├── buildHierarchy.dsl.ts
│   │           └── usecase/
│   │               ├── buildHierarchy.useCase.spec.ts
│   │               └── buildHierarchy.useCaseDriver.ts
│   └── shared/
│       └── result/
│           └── commandResult.ts                       # CommandResult<E>
```

### Injection de dépendances

Pas de framework DI — les use cases sont des classes pures, injectées via constructeur.

---

## Principes d'architecture

### Clean Architecture / Ports & Adapters

- **Entités** : classes avec `private constructor` + factory `static create()`. Pas de logique d'infra.
- **Use Cases** : une classe par cas d'usage, méthode `execute()` retourne `CommandResult<E>`.
- **Ports** : interfaces TypeScript (boardReader, sectionReader, connectorReader).
- **Adapters** : implémentations concrètes (figmaXxxReader pour la prod, inMemoryXxxReader pour les tests).

### Result pattern

- `CommandResult<E>` avec `private constructor` + factories `success(value?)`/`failure(error)`.
- Le type d'erreur `E` est `never` tant qu'aucun scénario d'erreur n'est testé.

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

### Tests — Pattern DSL / Driver / Spec

| Niveau | Fichiers | Environnement |
|--------|----------|---------------|
| **Unit (use case)** | `test/usecase/{feature}.useCase.spec.ts` + `useCaseDriver.ts` | In-memory, pas d'IO |

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

Un connecteur est valide seulement si le type parent est exactement un niveau au-dessus du type enfant.

### Shapes valides

- `ShapeWithTextNode` avec `shapeType` = `SQUARE` ou `ROUNDED_RECTANGLE`
- Texte non vide obligatoire

### Couleurs Figma

- Stockées en float 0-1 (`{ r, g, b }`). Conversion : `Math.round(r * 255)` → hex.
- Comparaison en uppercase.

### Sections / Releases

- Les releases sont des `SectionNode` FigJam
- Section avec nom non vide = release
- Containment : centre du shape `(x + width/2, y + height/2)` dans les bounds de la section

### Propagation des releases

- Une user story dans une section reçoit la release
- Ses enfants (rules, scenarios) héritent de la release du parent

---

## Vérification obligatoire après modification — OBLIGATOIRE

```bash
npm run test:unit    # Tous les tests passent
npm run build        # Bundle produit dist/code.js sans erreur
```

---

## Apprentissage continu — OBLIGATOIRE

Après CHAQUE correction ou retour de l'utilisateur, mettre à jour ce CLAUDE.md si nécessaire.
