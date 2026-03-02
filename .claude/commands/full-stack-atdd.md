# Full-Stack ATDD - Workflow orchestrateur pour User Story complète

Tu es en mode ATDD Full-Stack. À partir d'un numéro de User Story GitHub, tu orchestres les 3 workflows ATDD en séquence : Backend Use Case → Backend E2E → Frontend UI Integration.

---

## Etape 0 : Récupération de la US et regroupement

1. L'utilisateur fournit un numéro d'issue US (ex: `#33`)
2. Récupère le owner et repo via `gh repo view --json owner,name --jq '.owner.login + " " + .name'`
3. Utilise `gh api graphql` pour récupérer la US et ses sub-issues :
   ```bash
   gh api graphql -f query='query {
     repository(owner: "{owner}", name: "{repo}") {
       issue(number: {NUM}) {
         title
         body
         subIssues(first: 50) {
           nodes {
             number
             title
             state
             body
             issueType { name }
             labels(first: 10) {
               nodes { name }
             }
           }
         }
       }
     }
   }' --jq '.data.repository.issue'
   ```
4. Affiche la liste complète des sub-issues trouvées (numéro, titre, état, type, labels)
5. Filtre : ne garde que les sub-issues avec `state: OPEN` **ET** `issueType.name == "Scenario / critère d'acceptation"`
6. Regroupe par label (une sub-issue avec plusieurs labels apparaît dans plusieurs groupes) :
   - **Groupe 1** : `backend-usecase-test`
   - **Groupe 2** : `backend-e2e-test`
   - **Groupe 3** : `ui-test`
7. Affiche le résumé par groupe :
   ```
   === Résumé des scénarios ===

   Groupe 1 — Backend Use Case (backend-usecase-test) :
     - #{number} — {title}
     - #{number} — {title}

   Groupe 2 — Backend E2E (backend-e2e-test) :
     - #{number} — {title}

   Groupe 3 — Frontend UI Integration (ui-test) :
     - #{number} — {title}
     - #{number} — {title}
   ```

### Extraction du contexte du body

Le body des tickets (US parente et scénarios) peut contenir, en plus du Gherkin, des informations précieuses :
- **Règles métier** : validations, formats, contraintes fonctionnelles, calculs
- **Noms de domaine** : nommage des entités, des propriétés, des enums
- **API** : endpoints, méthodes HTTP, formats de requête/réponse, codes HTTP attendus
- **Règles UI** : labels, placeholders, data-testid suggérés, messages d'erreur/succès
- **Contraintes techniques** : types, structures de données, relations entre entités

**Tu DOIS extraire et utiliser ces informations** dans les phases suivantes. Ne te limite pas au Gherkin seul — le body entier est une source de vérité pour la génération.

---

## Boucle principale (3 phases séquentielles)

Pour chaque phase, si le groupe est vide : affiche "⏭ Groupe {N} — {nom} : aucun scénario, phase sautée." et passe à la phase suivante.

---

## Phase 1 — Backend Use Case

Pour chaque scénario du **Groupe 1** (`backend-usecase-test`), exécute les étapes 1.1 à 1.7.

### Etape 1.1 : Écriture du test

1. Analyse le scénario Gherkin **ET le contexte complet du body** (règles métier, noms de domaine, formats, contraintes — extraits à l'étape 0)
2. Identifie le module et la feature concernés dans `backend/src/modules/`
3. **Utilise le contexte du body pour informer la génération** : les noms d'entités, les propriétés, les valeurs de test, les messages d'erreur, les formats de données doivent refléter ce qui est décrit dans le ticket (pas des valeurs inventées)
4. Génère **uniquement** les fichiers de test :
   - **DSL** (`test/{feature}.dsl.ts`) — interface du contrat de test (une interface par scénario)
   - **In-Memory Repository** (`test/{feature}.inMemoryRepository.ts`) — repository in-memory pour les tests (si nécessaire)
   - **Driver** (`test/usecase/{feature}.useCaseDriver.ts`) — implémentation use case du DSL
   - **Spec** (`test/usecase/{feature}.useCase.spec.ts`) — le test
5. **NE PAS** modifier le code de prod à cette étape (ni entité, ni use case, ni enum/type)
6. **Règle YAGNI pour le repo in-memory** : en phase RED, le repo in-memory ne doit contenir **que** les méthodes de setup de test (ex: `givenOrderExists()`). Les méthodes du contrat repository (ex: `findById()`, `save()`) ne doivent **PAS** être implémentées en RED car rien ne les appelle encore. Elles seront ajoutées en GREEN quand le code de production en aura besoin.

### Etape 1.2 : Validation du test

**STOP** — Demande validation à l'utilisateur avec `AskUserQuestion` :
- Montre les fichiers de test générés/modifiés (DSL, Driver, Spec)
- Attends l'approbation explicite

**Si refusé** : corrige selon le retour de l'utilisateur et re-demande validation.

### Etape 1.3 : RED — Exécution du test

Seulement après validation du test :

1. **AUCUNE modification de code de production à cette étape.** Le test peut ne pas compiler — c'est normal et attendu en RED.
2. Exécute le test avec `npx vitest run <chemin-du-spec>` depuis `backend/`
3. Le test **DOIT** échouer (RED) — que ce soit une erreur de compilation (import manquant, propriété inexistante) ou une erreur d'assertion, les deux sont acceptables en RED.

**ATTENTION : NE PAS passer à l'étape 1.5 (GREEN) sans avoir COMMITÉ le test à l'étape 1.4. Le commit du test RED est OBLIGATOIRE avant toute implémentation.**

### Etape 1.4 : Commit du test — OBLIGATOIRE AVANT GREEN

**BLOQUANT** — Cette étape est un pré-requis absolu pour passer à l'étape 1.5.

Seulement après RED confirmé :
- Propose un message de commit : `tech: backend: test {nom du scénario} (#{id})`
- **STOP** — Demande validation du message de commit avec `AskUserQuestion`
- **Si validé** : commite
- **Si refusé** : ajuste le message et re-demande

**NE JAMAIS passer à l'étape 1.5 sans avoir exécuté cette étape.**

### Etape 1.5 : GREEN — Implémentation

Seulement après le commit du test (étape 1.4) :

1. **Lance le test** pour confirmer qu'il échoue (RED)
2. **Implémente le strict minimum** pour faire passer le test — sans code superflu, en respectant le contexte du body du ticket (noms de domaine, règles métier, formats, etc.)
3. **Lance le test** pour confirmer qu'il passe (GREEN)

### Etape 1.6 : Validation de l'implémentation

**STOP** — Demande validation à l'utilisateur avec `AskUserQuestion` :
- Montre les fichiers créés/modifiés
- Attends l'approbation explicite

**Si refusé** : corrige selon le retour de l'utilisateur et re-demande validation.

### Etape 1.7 : Commit de l'implémentation

Seulement après validation :
- Propose un message de commit : `feat: backend: {nom du scénario} (#{id})`
- **STOP** — Demande validation du message de commit avec `AskUserQuestion`
- **Si validé** : commite
- **Si refusé** : ajuste le message et re-demande

---

## Phase 2 — Backend E2E

Pour chaque scénario du **Groupe 2** (`backend-e2e-test`), exécute les étapes 2.1 à 2.7.

### Etape 2.1 : Écriture du test

1. Analyse le scénario Gherkin **ET le contexte complet du body** (règles métier, endpoints API, noms de domaine, codes HTTP — extraits à l'étape 0)
2. Identifie le module et la feature concernés dans `backend/src/modules/`
3. **Utilise le contexte du body pour informer la génération** : les endpoints, les codes HTTP, les noms de tables/colonnes, les valeurs de test, les messages d'erreur doivent refléter ce qui est décrit dans le ticket (pas des valeurs inventées)
4. Génère **uniquement** les fichiers de test :
   - **DSL** (`test/{feature}.dsl.ts`) — interface du contrat de test (une interface par scénario). Si le fichier DSL existe déjà, ajoute la nouvelle interface.
   - **Driver** (`test/e2e/{feature}.e2eDriver.ts`) — implémentation e2e du DSL
   - **Spec** (`test/e2e/{feature}.e2e-spec.ts`) — le test
5. **NE PAS** modifier le code de prod à cette étape (ni entité, ni use case, ni controller, ni module)

### Etape 2.2 : Validation du test

**STOP** — Demande validation à l'utilisateur avec `AskUserQuestion` :
- Montre les fichiers de test générés/modifiés (DSL, Driver, Spec)
- Attends l'approbation explicite

**Si refusé** : corrige selon le retour de l'utilisateur et re-demande validation.

### Etape 2.3 : RED — Exécution du test

Seulement après validation du test :

1. **AUCUNE modification de code de production à cette étape.** Le test peut ne pas compiler — c'est normal et attendu en RED.
2. Exécute le test avec `npx vitest run --config vitest.e2e.config.ts <chemin-du-spec>` depuis `backend/`
3. Le test **DOIT** échouer (RED) — que ce soit une erreur de compilation (import manquant, propriété inexistante) ou une erreur d'assertion, les deux sont acceptables en RED.

**ATTENTION : NE PAS passer à l'étape 2.5 (GREEN) sans avoir COMMITÉ le test à l'étape 2.4. Le commit du test RED est OBLIGATOIRE avant toute implémentation.**

### Etape 2.4 : Commit du test — OBLIGATOIRE AVANT GREEN

**BLOQUANT** — Cette étape est un pré-requis absolu pour passer à l'étape 2.5.

Seulement après RED confirmé :
- Propose un message de commit : `tech: backend: test e2e {nom du scénario} (#{id})`
- **STOP** — Demande validation du message de commit avec `AskUserQuestion`
- **Si validé** : commite
- **Si refusé** : ajuste le message et re-demande

**NE JAMAIS passer à l'étape 2.5 sans avoir exécuté cette étape.**

### Etape 2.5 : GREEN — Implémentation

Seulement après le commit du test (étape 2.4) :

1. **Lance le test** pour confirmer qu'il échoue (RED)
2. **Implémente le strict minimum** pour faire passer le test — sans code superflu, en respectant le contexte du body du ticket (endpoints, noms de domaine, règles métier, codes HTTP, etc.)
3. **Lance le test** pour confirmer qu'il passe (GREEN)

### Etape 2.6 : Validation de l'implémentation

**STOP** — Demande validation à l'utilisateur avec `AskUserQuestion` :
- Montre les fichiers créés/modifiés
- Attends l'approbation explicite

**Si refusé** : corrige selon le retour de l'utilisateur et re-demande validation.

### Etape 2.7 : Commit de l'implémentation

Seulement après validation :
- Propose un message de commit : `feat: backend: {nom du scénario} (#{id})`
- **STOP** — Demande validation du message de commit avec `AskUserQuestion`
- **Si validé** : commite
- **Si refusé** : ajuste le message et re-demande

---

## Phase 3 — Frontend UI Integration

Pour chaque scénario du **Groupe 3** (`ui-test`), exécute les étapes 3.1 et 3.2.

### Etape 3.1 : RED — Génération du test

#### 3.1.1. Analyse et génération

1. Analyse le scénario Gherkin **ET le contexte complet du body** (règles UI, messages, labels, routes, contraintes — extraits à l'étape 0)
2. Identifie le module et la feature concernés dans `frontend/src/modules/`
3. **Utilise le contexte du body pour informer la génération** : les data-testid, les textes affichés, les messages de toast, les labels de boutons, les placeholders, les routes de navigation doivent refléter ce qui est décrit dans le ticket (pas des valeurs inventées)
4. Génère **4 fichiers** :
   - **DSL** (`test/{feature}.dsl.ts`) — interface du contrat de test
   - **In-Memory Repository** (`test/{feature}.inMemoryRepository.ts`) — repository in-memory pour les tests
   - **Driver** (`test/ui-integration/{feature}.uiIntegrationDriver.tsx`) — implémentation UI du DSL
   - **Spec** (`test/ui-integration/{feature}.uiIntegration.spec.tsx`) — le test

**AUCUN CODE DE PROD NE DOIT ETRE ECRIT A CETTE ETAPE.**

**Règle YAGNI pour le repo in-memory** : en phase RED, le repo in-memory ne doit contenir **que** les méthodes de setup de test (ex: `givenOrderExists()`). Les méthodes du contrat repository (ex: `findOrderBeingRegistered()`) ne doivent **PAS** être implémentées en RED car rien ne les appelle encore. Elles seront ajoutées en GREEN quand le code de production en aura besoin. Le `implements InterfaceRepository` peut être déclaré (erreur d'import tolérée), mais sans implémenter les méthodes du contrat.

#### 3.1.2. Vérification TypeScript

Exécute `npx tsc --noEmit` depuis `frontend/`.

Seules erreurs tolérées en phase RED :
- Import d'un composant/page qui n'existe pas encore
- Import de types spécifiques au composant à créer

**Toute autre erreur TypeScript doit être corrigée.**

#### 3.1.3. Validation du test

**STOP** — Demande validation à l'utilisateur avec `AskUserQuestion` :
- Montre les fichiers générés (DSL, Driver, Spec)
- Confirme les erreurs d'import tolérées
- Attends l'approbation explicite

**Si refusé** : corrige selon le retour de l'utilisateur et re-demande validation.

#### 3.1.4. Commit du test — OBLIGATOIRE AVANT GREEN

**BLOQUANT** — Cette étape est un pré-requis absolu pour passer à l'étape 3.2.

Seulement après validation du test :
- Propose un message de commit : `tech: frontend: test {nom du scénario} (#{id})`
- **STOP** — Demande validation du message de commit avec `AskUserQuestion`
- **Si validé** : commite
- **Si refusé** : ajuste le message et re-demande

**ATTENTION : NE PAS passer à l'étape 3.2 (GREEN) sans avoir COMMITÉ le test. Le commit du test RED est OBLIGATOIRE avant toute implémentation.**

### Etape 3.2 : GREEN — Implémentation

Seulement après le commit du test (étape 3.1.4) :

#### 3.2.1. Implémentation

1. **Lance le test** (`npm run test:ui-integration`) depuis `frontend/` pour confirmer qu'il échoue (RED)
2. **Implémente le strict minimum** pour faire passer le test, en respectant le contexte du body du ticket (labels, messages, structure de page, routes, etc.)
3. **Lance le test** pour confirmer qu'il passe (GREEN)
4. **Lance `npx tsc --noEmit`** pour vérifier la compilation

#### 3.2.2. Validation de l'implémentation

**STOP** — Demande validation à l'utilisateur avec `AskUserQuestion` :
- Montre les fichiers créés/modifiés
- Attends l'approbation explicite

**Si refusé** : corrige selon le retour de l'utilisateur et re-demande validation.

#### 3.2.3. Commit de l'implémentation

Seulement après validation de l'implémentation :
- Propose un message de commit : `feat: frontend: {nom du scénario} (#{id})`
- **STOP** — Demande validation du message de commit avec `AskUserQuestion`
- **Si validé** : commite
- **Si refusé** : ajuste le message et re-demande

---

## Règles strictes

- **PRIVILÉGIE** le code de référence fourni dans cette commande comme source de vérité. Tu ne devrais avoir besoin de lire les fichiers du projet que pour effectuer tes éditions. Ne scanne le code existant qu'en dernier recours si une information manque dans la référence.
- **JAMAIS** de code de prod non couvert par un test
- **JAMAIS** d'anticipation de besoins futurs
- **JAMAIS** de "au cas où" ou de code défensif non demandé
- **TOUJOURS** le minimum pour faire passer le test
- **TOUJOURS** une interface DSL par scénario
- **TOUJOURS** un driver par scénario
- **TOUJOURS** un `afterEach` avec `cleanup()` dans les specs e2e pour arrêter l'app et le container
- **TOUJOURS** commiter le test RED AVANT de passer à l'implémentation GREEN — ne jamais sauter cette étape
- **JAMAIS** de modification de code de production en phase RED — ni scaffolding, ni propriété optionnelle, ni rien. Le test RED peut ne pas compiler, c'est normal.
- **TOUJOURS** utiliser `data-testid` pour les sélecteurs UI
- **TOUJOURS** utiliser `userEvent` pour les interactions UI
- **TOUJOURS** utiliser `findBy` / `waitFor` pour les assertions asynchrones UI

---

## Architecture du projet — Backend

### Structure des fichiers

```
backend/src/modules/{domain}/{feature}/
├── {feature}.useCase.ts                    # Use case (NestJS @Injectable)
├── {feature}.controller.ts                 # Controller (NestJS @Controller)
├── {feature}.{entity}Repository.ts         # Interface repository
├── {feature}.typeOrmRepository.ts          # Implémentation TypeORM du repository
├── {entity}.ts                             # Entité (private constructor + factory create())
├── {entity}.entity.ts                      # Entity TypeORM (mapping base de données)
└── test/
    ├── {feature}.dsl.ts                    # Interfaces DSL (une par scénario)
    ├── {feature}.inMemoryRepository.ts     # Repository in-memory pour les tests unitaires
    ├── deterministicDateTimeProvider.ts    # DateTimeProvider déterministe (si besoin)
    ├── usecase/
    │   ├── {feature}.useCase.spec.ts       # Spec du test unitaire
    │   └── {feature}.useCaseDriver.ts      # Drivers unitaires (un par scénario)
    └── e2e/
        ├── {feature}.e2e-spec.ts           # Spec du test e2e
        └── {feature}.e2eDriver.ts          # Drivers e2e (un par scénario)
```

### Modules NestJS

```
backend/src/
├── app.module.ts                           # Module racine (TypeORM + modules)
└── modules/
    ├── {domain}/
    │   └── {domain}.module.ts              # Module NestJS du domaine
    └── shared/
        ├── dateTime/
        │   ├── dateTimeProvider.ts          # Interface DateTimeProvider { now(): Date }
        │   └── systemDateTimeProvider.ts    # Implémentation système
        ├── result/
        │   └── commandResult.ts            # CommandResult<E> (success/failure)
        └── uuid/
            └── uuid.ts                     # generateUUID() + type UUID
```

---

## Architecture du projet — Frontend

### Structure des fichiers

```
frontend/src/modules/{domain}/{feature}/
├── {feature}.component.tsx                    # Composant React
├── use{Feature}.useCase.ts                    # Use case (hook)
├── {feature}.repository.ts                    # Interface repository
├── {feature}.fetchRepository.ts               # Implémentation fetch
├── {feature}.dependenciesContainer.ts         # Container des dépendances
└── test/
    ├── {feature}.dsl.ts                       # Interface DSL du test
    ├── {feature}.inMemoryRepository.ts        # Repository in-memory pour les tests
    └── ui-integration/
        ├── {feature}.uiIntegrationDriver.tsx  # Driver UI (implémente le DSL)
        └── {feature}.uiIntegration.spec.tsx   # Spec du test
```

### Pages et routes

- Les pages sont dans `frontend/src/modules/shared/ui/pages/`
- Les routes sont dans `frontend/src/router.tsx`
- Le layout racine avec `<Toaster />` est dans `frontend/src/modules/shared/ui/layout/RootLayout.tsx`

### Injection de dépendances

```
DependenciesProvider (React Context)
  └── useDependencies() hook
       └── renvoie les repositories injectés
```

- Container global : `frontend/src/modules/shared/dependencies/dependenciesContainer.ts`
- Container par feature : `frontend/src/modules/{domain}/{feature}/{feature}.dependenciesContainer.ts`

---

## Code de référence — Backend Use Case (Phase 1)

### DSL (une interface par scénario)

```typescript
// src/modules/orderRegistration/startRegisterEmptyOrder/startRegisterEmptyOrder/test/startRegisterEmptyOrder.dsl.ts
export interface SuccessfulCreationDSL {
  givenUserIsNotAuthenticated(): void;
  whenUserCreatesOrder(): Promise<void>;
  thenOrderIsCreated(): void;
}

export interface CreationDateRecordedDSL {
  givenUserIsNotAuthenticated(): void;
  givenCurrentDateIs(date: Date): void;
  whenUserCreatesOrder(): Promise<void>;
  thenOrderCreationDateIs(expectedDate: Date): void;
}
```

### In-Memory Repository

```typescript
// src/modules/orderRegistration/startRegisterEmptyOrder/startRegisterEmptyOrder/test/startRegisterEmptyOrder.inMemoryRepository.ts
import { Order } from '@src/modules/orderRegistration/order';
import type { StartRegisterEmptyOrderOrderRepository } from '@src/modules/orderRegistration/startRegisterEmptyOrder/startRegisterEmptyOrder/startRegisterEmptyOrder.orderRepository';

export class StartRegisterEmptyOrderInMemoryOrderRepository
  implements StartRegisterEmptyOrderOrderRepository
{
  orders: Order[] = [];

  async save(order: Order): Promise<void> {
    this.orders.push(order);
  }
}
```

### DeterministicDateTimeProvider

```typescript
// src/modules/orderRegistration/startRegisterEmptyOrder/startRegisterEmptyOrder/test/deterministicDateTimeProvider.ts
import type { DateTimeProvider } from '@src/modules/shared/dateTime/dateTimeProvider';

export class DeterministicDateTimeProvider implements DateTimeProvider {
  constructor(private readonly fixedDate: Date) {}

  now(): Date {
    return this.fixedDate;
  }
}
```

### Drivers (un par scénario)

```typescript
// src/modules/orderRegistration/startRegisterEmptyOrder/startRegisterEmptyOrder/test/usecase/startRegisterEmptyOrder.useCaseDriver.ts
import { expect } from 'vitest';
import {
  StartRegisterEmptyOrderUseCase,
  StartRegisterEmptyOrderError,
} from '@src/modules/orderRegistration/startRegisterEmptyOrder/startRegisterEmptyOrder/startRegisterEmptyOrder.useCase';
import { StartRegisterEmptyOrderInMemoryOrderRepository } from '@src/modules/orderRegistration/startRegisterEmptyOrder/startRegisterEmptyOrder/test/startRegisterEmptyOrder.inMemoryRepository';
import { DeterministicDateTimeProvider } from '@src/modules/orderRegistration/startRegisterEmptyOrder/startRegisterEmptyOrder/test/deterministicDateTimeProvider';
import { generateUUID } from '@src/modules/shared/uuid/uuid';
import { CommandResult } from '@src/modules/shared/result/commandResult';
import type {
  SuccessfulCreationDSL,
  CreationDateRecordedDSL,
} from '@src/modules/orderRegistration/startRegisterEmptyOrder/startRegisterEmptyOrder/test/startRegisterEmptyOrder.dsl';

export class SuccessfulCreationUseCaseDriver implements SuccessfulCreationDSL {
  private repository = new StartRegisterEmptyOrderInMemoryOrderRepository();
  private result!: CommandResult<StartRegisterEmptyOrderError>;
  private useCase = new StartRegisterEmptyOrderUseCase(
    this.repository,
    new DeterministicDateTimeProvider(new Date()),
  );

  givenUserIsNotAuthenticated() {
    // No setup needed, user is not authenticated by default
  }

  async whenUserCreatesOrder() {
    this.result = await this.useCase.execute({
      orderId: generateUUID(),
    });
  }

  thenOrderIsCreated() {
    expect(this.result.isSuccess()).toBe(true);
    expect(this.repository.orders).toHaveLength(1);
  }
}

export class CreationDateRecordedUseCaseDriver
  implements CreationDateRecordedDSL
{
  private repository = new StartRegisterEmptyOrderInMemoryOrderRepository();
  private dateTimeProvider!: DeterministicDateTimeProvider;
  private useCase!: StartRegisterEmptyOrderUseCase;

  givenUserIsNotAuthenticated() {
    // No setup needed, user is not authenticated by default
  }

  givenCurrentDateIs(date: Date) {
    this.dateTimeProvider = new DeterministicDateTimeProvider(date);
    this.useCase = new StartRegisterEmptyOrderUseCase(
      this.repository,
      this.dateTimeProvider,
    );
  }

  async whenUserCreatesOrder() {
    await this.useCase.execute({
      orderId: generateUUID(),
    });
  }

  thenOrderCreationDateIs(expectedDate: Date) {
    expect(this.repository.orders[0].creationDate).toEqual(expectedDate);
  }
}
```

### Spec (le test)

```typescript
// src/modules/orderRegistration/startRegisterEmptyOrder/startRegisterEmptyOrder/test/usecase/startRegisterEmptyOrder.useCase.spec.ts
import { describe, test } from 'vitest';
import {
  CreationDateRecordedUseCaseDriver,
  SuccessfulCreationUseCaseDriver,
} from '@src/modules/orderRegistration/startRegisterEmptyOrder/startRegisterEmptyOrder/test/usecase/startRegisterEmptyOrder.useCaseDriver';

describe("Création d'une commande", () => {
  test('commande créée avec succès', async () => {
    const useCaseDriver = new SuccessfulCreationUseCaseDriver();

    useCaseDriver.givenUserIsNotAuthenticated();

    await useCaseDriver.whenUserCreatesOrder();

    useCaseDriver.thenOrderIsCreated();
  });

  test('Ajout de la date de création', async () => {
    const useCaseDriver = new CreationDateRecordedUseCaseDriver();
    const creationDate = new Date('2025-02-22T14:30:00');

    useCaseDriver.givenUserIsNotAuthenticated();
    useCaseDriver.givenCurrentDateIs(creationDate);

    await useCaseDriver.whenUserCreatesOrder();

    useCaseDriver.thenOrderCreationDateIs(creationDate);
  });
});
```

### Entité

```typescript
// src/modules/orderRegistration/order.ts
import { UUID } from '@src/modules/shared/uuid/uuid';

export enum OrderStatus {
  EN_COURS = 'EN_COURS',
}

export class Order {
  private constructor(
    readonly orderId: UUID,
    readonly creationDate: Date,
    readonly status: OrderStatus,
  ) {}

  static create(orderId: UUID, creationDate: Date): Order {
    return new Order(orderId, creationDate, OrderStatus.EN_COURS);
  }
}
```

### Use Case

```typescript
// src/modules/orderRegistration/startRegisterEmptyOrder/startRegisterEmptyOrder/startRegisterEmptyOrder.useCase.ts
import { Injectable } from '@nestjs/common';
import { UUID } from '@src/modules/shared/uuid/uuid';
import { Order } from '@src/modules/orderRegistration/order';
import { StartRegisterEmptyOrderOrderRepository } from '@src/modules/orderRegistration/startRegisterEmptyOrder/startRegisterEmptyOrder/startRegisterEmptyOrder.orderRepository';
import { DateTimeProvider } from '@src/modules/shared/dateTime/dateTimeProvider';
import { CommandResult } from '@src/modules/shared/result/commandResult';

export type StartRegisterEmptyOrderCommand = {
  orderId: UUID;
};

export type StartRegisterEmptyOrderError = never;

@Injectable()
export class StartRegisterEmptyOrderUseCase {
  constructor(
    private orderRepository: StartRegisterEmptyOrderOrderRepository,
    private dateTimeProvider: DateTimeProvider,
  ) {}

  async execute(
    startRegisterEmptyOrderCommand: StartRegisterEmptyOrderCommand,
  ): Promise<CommandResult<StartRegisterEmptyOrderError>> {
    const order = Order.create(
      startRegisterEmptyOrderCommand.orderId,
      this.dateTimeProvider.now(),
    );
    await this.orderRepository.save(order);
    return CommandResult.success();
  }
}
```

### Repository (interface)

```typescript
// src/modules/orderRegistration/startRegisterEmptyOrder/startRegisterEmptyOrder/startRegisterEmptyOrder.orderRepository.ts
import { Order } from '@src/modules/orderRegistration/order';

export interface StartRegisterEmptyOrderOrderRepository {
  save(order: Order): Promise<void>;
}
```

### DateTimeProvider (interface partagée)

```typescript
// src/modules/shared/dateTime/dateTimeProvider.ts
export interface DateTimeProvider {
  now(): Date;
}
```

### CommandResult (utilitaire partagé)

```typescript
// src/modules/shared/result/commandResult.ts
export class CommandResult<E> {
  private _value?: unknown;

  private constructor(
    private readonly _success: boolean,
    private readonly _error?: E,
  ) {}

  static success<E>(value?: unknown): CommandResult<E> {
    const result = new CommandResult<E>(true);
    result._value = value;
    return result;
  }

  static failure<E>(error: E): CommandResult<E> {
    return new CommandResult<E>(false, error);
  }

  isSuccess(): boolean {
    return this._success;
  }

  isFailure(): boolean {
    return !this._success;
  }

  getError(): E {
    if (this._success) {
      throw new Error('Cannot get error from a successful result');
    }
    return this._error as E;
  }

  getValue<T>(): T {
    if (!this._success) {
      throw new Error('Cannot get value from a failed result');
    }
    return this._value as T;
  }
}
```

### UUID (utilitaire partagé)

```typescript
// src/modules/shared/uuid/uuid.ts
import { v4 as uuidv4 } from 'uuid';

export const generateUUID = (): UUID => {
  return uuidv4() as UUID;
};

export type UUID = `${string}-${string}-${string}-${string}-${string}`;
```

---

## Code de référence — Backend E2E (Phase 2)

### DSL (une interface par scénario)

```typescript
// src/modules/orderRegistration/startRegisterEmptyOrder/test/startRegisterEmptyOrder.dsl.ts
export interface SuccessfulCreationDSL {
  givenCreateOrderSystemIsOperationnal(): Promise<void> | void;
  givenUserIsNotAuthenticated(): void;
  whenUserCreatesOrder(): Promise<void>;
  thenOrderIsCreated(): void | Promise<void>;
}
```

### E2E Driver (un par scénario)

```typescript
// src/modules/orderRegistration/startRegisterEmptyOrder/test/e2e/startRegisterEmptyOrder.e2eDriver.ts
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { expect } from 'vitest';
import { AppModule } from '@src/app.module';
import { generateUUID } from '@src/modules/shared/uuid/uuid';
import { DataSource } from 'typeorm';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import type { SuccessfulCreationDSL } from '@src/modules/orderRegistration/startRegisterEmptyOrder/test/startRegisterEmptyOrder.dsl';

export class SuccessfulCreationE2eDriver implements SuccessfulCreationDSL {
  private app!: INestApplication;
  private response!: request.Response;
  private pgContainer!: StartedPostgreSqlContainer;

  async givenCreateOrderSystemIsOperationnal() {
    this.pgContainer = await new PostgreSqlContainer(
      'postgres:16-alpine',
    ).start();

    process.env.POSTGRES_HOST = this.pgContainer.getHost();
    process.env.POSTGRES_PORT = this.pgContainer.getPort().toString();
    process.env.POSTGRES_USER = this.pgContainer.getUsername();
    process.env.POSTGRES_PASSWORD = this.pgContainer.getPassword();
    process.env.POSTGRES_DB = this.pgContainer.getDatabase();

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    this.app = moduleFixture.createNestApplication();
    this.app.setGlobalPrefix('api');
    await this.app.init();
  }

  givenUserIsNotAuthenticated() {
    // No setup needed, user is not authenticated by default
  }

  async whenUserCreatesOrder() {
    this.response = await request(this.app.getHttpServer())
      .post('/api/order-entry/create-order')
      .send({ orderId: generateUUID() });
  }

  async thenOrderIsCreated() {
    expect(this.response.status).toBe(201);

    const dataSource = this.app.get(DataSource);
    const orders = await dataSource.query('SELECT * FROM orders');
    expect(orders).toHaveLength(1);
  }

  async cleanup() {
    await this.app?.close();
    await this.pgContainer?.stop();
  }
}
```

### E2E Spec (le test)

```typescript
// src/modules/orderRegistration/startRegisterEmptyOrder/test/e2e/startRegisterEmptyOrder.e2e-spec.ts
import { describe, test, afterEach } from 'vitest';
import { SuccessfulCreationE2eDriver } from '@src/modules/orderRegistration/startRegisterEmptyOrder/test/e2e/startRegisterEmptyOrder.e2eDriver';

describe("Création d'une commande", () => {
  let e2eDriver: SuccessfulCreationE2eDriver;

  afterEach(async () => {
    await e2eDriver?.cleanup();
  });

  test('commande créée avec succès', async () => {
    e2eDriver = new SuccessfulCreationE2eDriver();

    await e2eDriver.givenCreateOrderSystemIsOperationnal();
    e2eDriver.givenUserIsNotAuthenticated();
    await e2eDriver.whenUserCreatesOrder();
    await e2eDriver.thenOrderIsCreated();
  });
});
```

### Controller

```typescript
// src/modules/orderRegistration/startRegisterEmptyOrder/startRegisterEmptyOrder.controller.ts
import { Body, Controller, Inject, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import {
  StartRegisterEmptyOrderCommand,
  StartRegisterEmptyOrderUseCase,
} from '@src/modules/orderRegistration/startRegisterEmptyOrder/startRegisterEmptyOrder.useCase';

@Controller('order-entry')
export class StartRegisterEmptyOrderController {
  constructor(
    @Inject(StartRegisterEmptyOrderUseCase)
    private readonly startRegisterEmptyOrderUseCase: StartRegisterEmptyOrderUseCase,
  ) {}

  @Post('registerEmptyOrder-order')
  async startRegisterEmptyOrder(
    @Body() body: StartRegisterEmptyOrderCommand,
    @Res() res: Response,
  ): Promise<void> {
    const result = await this.startRegisterEmptyOrderUseCase.execute(body);

    if (result.isSuccess()) {
      res.status(201).send();
    }
  }
}
```

### TypeORM Repository (implémentation)

```typescript
// src/modules/orderRegistration/startRegisterEmptyOrder/startRegisterEmptyOrder.typeOrmRepository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '@src/modules/orderRegistration/order';
import { OrderEntity } from '@src/modules/orderRegistration/order.entity';
import type { StartRegisterEmptyOrderOrderRepository } from '@src/modules/orderRegistration/startRegisterEmptyOrder/startRegisterEmptyOrder.orderRepository';

@Injectable()
export class TypeOrmStartRegisterEmptyOrderOrderRepository
  implements StartRegisterEmptyOrderOrderRepository
{
  constructor(
    @InjectRepository(OrderEntity)
    private readonly repository: Repository<OrderEntity>,
  ) {}

  async save(order: Order): Promise<void> {
    await this.repository.save({
      orderId: order.orderId,
      creationDate: order.creationDate,
      status: order.status,
    });
  }
}
```

### Entity TypeORM (mapping BDD)

```typescript
// src/modules/orderRegistration/order.entity.ts
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('orders')
export class OrderEntity {
  @PrimaryColumn('varchar')
  orderId: string;

  @Column('timestamp')
  creationDate: Date;

  @Column('varchar')
  status: string;
}
```

### Module NestJS

```typescript
// src/modules/orderRegistration/orderRegistration.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StartRegisterEmptyOrderController } from '@src/modules/orderRegistration/startRegisterEmptyOrder/startRegisterEmptyOrder.controller';
import { StartRegisterEmptyOrderUseCase } from '@src/modules/orderRegistration/startRegisterEmptyOrder/startRegisterEmptyOrder.useCase';
import { TypeOrmStartRegisterEmptyOrderOrderRepository } from '@src/modules/orderRegistration/startRegisterEmptyOrder/startRegisterEmptyOrder.typeOrmRepository';
import { SystemDateTimeProvider } from '@src/modules/shared/dateTime/systemDateTimeProvider';
import { OrderEntity } from '@src/modules/orderRegistration/order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([OrderEntity])],
  controllers: [StartRegisterEmptyOrderController],
  providers: [
    StartRegisterEmptyOrderUseCase,
    TypeOrmStartRegisterEmptyOrderOrderRepository,
    SystemDateTimeProvider,
  ],
})
export class OrderRegistrationModule {}
```

### App Module

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderRegistrationModule } from '@src/modules/orderRegistration/orderRegistration.module';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres' as const,
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
        username: process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD || 'postgres_password',
        database: process.env.POSTGRES_DB || 'discac_yoda',
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),
    OrderRegistrationModule,
  ],
})
export class AppModule {}
```

### Modules partagés

```typescript
// src/modules/shared/dateTime/dateTimeProvider.ts
export interface DateTimeProvider {
  now(): Date;
}
```

```typescript
// src/modules/shared/dateTime/systemDateTimeProvider.ts
import { Injectable } from '@nestjs/common';
import type { DateTimeProvider } from '@src/modules/shared/dateTime/dateTimeProvider';

@Injectable()
export class SystemDateTimeProvider implements DateTimeProvider {
  now(): Date {
    return new Date();
  }
}
```

---

## Code de référence — Frontend UI Integration (Phase 3)

### DSL (interface du contrat de test)

```typescript
// src/modules/orderRegistration/startRegisterEmptyOrder/test/startRegisterEmptyOrder.dsl.ts
export interface StartRegisterEmptyOrderSuccessDSL {
    givenStartRegisterEmptyOrderSystemIsOperationnal(): Promise<void>;
    givenUserIsNotAuthenticated(): Promise<void>;
    whenUserCreatesOrder(): Promise<void>;
    thenOrderIsCreated(): Promise<void>;
}

export interface StartRegisterEmptyOrderUuidGeneratedDSL {
    givenStartRegisterEmptyOrderSystemIsOperationnal(): Promise<void>;
    givenUserIsNotAuthenticated(): Promise<void>;
    whenUserCreatesOrder(): Promise<void>;
    thenOrderIsCreatedWithUuidIdentifier(): Promise<void>;
}
```

### In-Memory Repository

```typescript
// src/modules/orderRegistration/startRegisterEmptyOrder/test/startRegisterEmptyOrder.inMemoryRepository.ts
import type { StartRegisterEmptyOrderRepository } from "@src/modules/orderRegistration/startRegisterEmptyOrder/startRegisterEmptyOrder.repository.ts";
import type { StartRegisterEmptyOrderCommand } from "@src/modules/orderRegistration/startRegisterEmptyOrder/useStartRegisterEmptyOrder.useCase.ts";

export class StartRegisterEmptyOrderInMemoryRepository implements StartRegisterEmptyOrderRepository {
    orders: StartRegisterEmptyOrderCommand[] = [];

    async execute(startRegisterEmptyOrderCommand: StartRegisterEmptyOrderCommand): Promise<void> {
        this.orders.push(startRegisterEmptyOrderCommand);
    }
}
```

### Driver UI (classe implémentant le DSL)

```tsx
// src/modules/orderRegistration/startRegisterEmptyOrder/test/ui-integration/startRegisterEmptyOrder.uiIntegrationDriver.tsx
import { expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RouterProvider } from "@tanstack/react-router";
import { DependenciesProvider } from "@src/modules/shared/dependencies/dependencies.provider.tsx";
import { StartRegisterEmptyOrderDependenciesContainer } from "@src/modules/orderRegistration/startRegisterEmptyOrder/startRegisterEmptyOrder.dependenciesContainer.ts";
import { StartRegisterEmptyOrderInMemoryRepository } from "@src/modules/orderRegistration/startRegisterEmptyOrder/test/startRegisterEmptyOrder.inMemoryRepository.ts";
import { createTestRouter } from "@src/modules/shared/test/createTestRouter.ts";
import type { StartRegisterEmptyOrderSuccessDSL, StartRegisterEmptyOrderUuidGeneratedDSL } from "@src/modules/orderRegistration/startRegisterEmptyOrder/test/startRegisterEmptyOrder.dsl.ts";

export class StartRegisterEmptyOrderSuccessUiDriver implements StartRegisterEmptyOrderSuccessDSL {
    async givenStartRegisterEmptyOrderSystemIsOperationnal() {
        const testDependencies = new StartRegisterEmptyOrderDependenciesContainer(new StartRegisterEmptyOrderInMemoryRepository()).dependencies;
        const testRouter = createTestRouter("/commandes/creer");
        render(
            <DependenciesProvider dependencies={testDependencies}>
                <RouterProvider router={testRouter} />
            </DependenciesProvider>,
        );
        await screen.findByTestId("start-register-empty-order-title");
    }

    async givenUserIsNotAuthenticated() {
        // No setup needed, user is not authenticated by default
    }

    async whenUserCreatesOrder() {
        const user = userEvent.setup();
        await user.click(screen.getByTestId("start-register-empty-order-submit"));
    }

    async thenOrderIsCreated() {
        expect(await screen.findByText("Commande créée avec succès")).toBeInTheDocument();
    }
}

export class StartRegisterEmptyOrderUuidGeneratedUiDriver implements StartRegisterEmptyOrderUuidGeneratedDSL {
    private repository = new StartRegisterEmptyOrderInMemoryRepository();

    async givenStartRegisterEmptyOrderSystemIsOperationnal() {
        const testDependencies = new StartRegisterEmptyOrderDependenciesContainer(this.repository).dependencies;
        const testRouter = createTestRouter("/commandes/creer");
        render(
            <DependenciesProvider dependencies={testDependencies}>
                <RouterProvider router={testRouter} />
            </DependenciesProvider>,
        );
        await screen.findByTestId("start-register-empty-order-title");
    }

    async givenUserIsNotAuthenticated() {
        // No setup needed, user is not authenticated by default
    }

    async whenUserCreatesOrder() {
        const user = userEvent.setup();
        await user.click(screen.getByTestId("start-register-empty-order-submit"));
    }

    async thenOrderIsCreatedWithUuidIdentifier() {
        await waitFor(() => {
            expect(this.repository.orders).toHaveLength(1);
            expect(this.repository.orders[0].orderId).toMatch(
                /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
            );
        });
    }
}
```

### Spec (le test)

```tsx
// src/modules/orderRegistration/startRegisterEmptyOrder/test/ui-integration/startRegisterEmptyOrder.uiIntegration.spec.tsx
import { describe, test } from "vitest";
import { StartRegisterEmptyOrderSuccessUiDriver, StartRegisterEmptyOrderUuidGeneratedUiDriver } from "./startRegisterEmptyOrder.uiIntegrationDriver.tsx";

describe("Création d'une commande", () => {
    test("création réussie, utilisateur notifié", async () => {
        const ui = new StartRegisterEmptyOrderSuccessUiDriver();

        await ui.givenStartRegisterEmptyOrderSystemIsOperationnal();

        await ui.givenUserIsNotAuthenticated();

        await ui.whenUserCreatesOrder();

        await ui.thenOrderIsCreated();
    });

    test("identifiant UUID généré", async () => {
        const ui = new StartRegisterEmptyOrderUuidGeneratedUiDriver();

        await ui.givenStartRegisterEmptyOrderSystemIsOperationnal();

        await ui.givenUserIsNotAuthenticated();

        await ui.whenUserCreatesOrder();

        await ui.thenOrderIsCreatedWithUuidIdentifier();
    });
});
```

### Composant

```tsx
// src/modules/orderRegistration/startRegisterEmptyOrder/startRegisterEmptyOrder.component.tsx
import { useStartRegisterEmptyOrder } from "@src/modules/orderRegistration/startRegisterEmptyOrder/useStartRegisterEmptyOrder.useCase.ts";

export const StartRegisterEmptyOrder = () => {
    const { startRegisterEmptyOrderCommandHandler, loading } = useStartRegisterEmptyOrder();

    return (
        <div>
            <h1 data-testid="start-register-empty-order-title">Créer une commande</h1>
            <button
                data-testid="start-register-empty-order-submit"
                onClick={startRegisterEmptyOrderCommandHandler}
                disabled={loading}
            >
                {loading ? "Création en cours..." : "Créer la commande"}
            </button>
        </div>
    );
};
```

### Use Case

```typescript
// src/modules/orderRegistration/startRegisterEmptyOrder/useStartRegisterEmptyOrder.useCase.ts
import { useState } from "react";
import { toast } from "sonner";
import { generateUUID, type UUID } from "@src/modules/shared/uuid.ts";
import { useDependencies } from "@src/modules/shared/dependencies/useDependencies.ts";

export type StartRegisterEmptyOrderCommand = {
    orderId: UUID;
}

export const useStartRegisterEmptyOrder = () => {

    const {startRegisterEmptyOrderRepository} = useDependencies();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const startRegisterEmptyOrderCommandHandler = async () => {

        try {
            setLoading(true);
            setError(null);
            setSuccess(false);

            const startRegisterEmptyOrderCommand = {
                orderId: generateUUID()
            }

            await startRegisterEmptyOrderRepository.execute(startRegisterEmptyOrderCommand);
            setSuccess(true);
            toast.success("Commande créée avec succès");
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
                toast.error(err.message);
            } else {
                const errorMessage = "Erreur lors de la création de la commande.";
                setError(errorMessage);
                toast.error(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    }

    return { startRegisterEmptyOrderCommandHandler, loading, error, success };
}
```

### Repository (interface)

```typescript
// src/modules/orderRegistration/startRegisterEmptyOrder/startRegisterEmptyOrder.repository.ts
import type { StartRegisterEmptyOrderCommand } from "@src/modules/orderRegistration/startRegisterEmptyOrder/useStartRegisterEmptyOrder.useCase.ts";

export interface StartRegisterEmptyOrderRepository {
    execute(startRegisterEmptyOrderCommand: StartRegisterEmptyOrderCommand): Promise<void>;
}
```

### Fetch Repository (implémentation)

```typescript
// src/modules/orderRegistration/startRegisterEmptyOrder/startRegisterEmptyOrder.fetchRepository.ts
import type { StartRegisterEmptyOrderCommand } from "@src/modules/orderRegistration/startRegisterEmptyOrder/useStartRegisterEmptyOrder.useCase.ts";
import type { StartRegisterEmptyOrderRepository } from "@src/modules/orderRegistration/startRegisterEmptyOrder/startRegisterEmptyOrder.repository.ts";

export class StartRegisterEmptyOrderFetchRepository implements StartRegisterEmptyOrderRepository {

    async execute(startRegisterEmptyOrderCommand: StartRegisterEmptyOrderCommand): Promise<void> {
        const response = await fetch("/api/order-entry/create-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(startRegisterEmptyOrderCommand),
        });

        if (!response.ok) {
            throw new Error("Erreur lors de la création de la commande.");
        }
    }
}
```

### Dependencies Container (par feature)

```typescript
// src/modules/orderRegistration/startRegisterEmptyOrder/startRegisterEmptyOrder.dependenciesContainer.ts
import type { StartRegisterEmptyOrderRepository } from "@src/modules/orderRegistration/startRegisterEmptyOrder/startRegisterEmptyOrder.repository.ts";
import { StartRegisterEmptyOrderFetchRepository } from "@src/modules/orderRegistration/startRegisterEmptyOrder/startRegisterEmptyOrder.fetchRepository.ts";

export type StartRegisterEmptyOrderDependencies = {
    startRegisterEmptyOrderRepository: StartRegisterEmptyOrderRepository;
};

export class StartRegisterEmptyOrderDependenciesContainer {
    readonly dependencies: StartRegisterEmptyOrderDependencies;
    constructor(startRegisterEmptyOrderRepository: StartRegisterEmptyOrderRepository = new StartRegisterEmptyOrderFetchRepository()) {
        this.dependencies = { startRegisterEmptyOrderRepository };
    }
}
```

### Dependencies Container (global)

```typescript
// src/modules/shared/dependencies/dependenciesContainer.ts
import {
    type StartRegisterEmptyOrderDependencies, StartRegisterEmptyOrderDependenciesContainer,
} from "@src/modules/orderRegistration/startRegisterEmptyOrder/startRegisterEmptyOrder.dependenciesContainer.ts";

export type Dependencies = StartRegisterEmptyOrderDependencies;

export class DependenciesContainer {
    readonly dependencies: Dependencies;
    constructor() {
        this.dependencies = {
            ...new StartRegisterEmptyOrderDependenciesContainer().dependencies,
        };
    }
}
```

### Dependencies Provider

```tsx
// src/modules/shared/dependencies/dependencies.provider.tsx
import { createContext } from "react";
import type { ReactNode } from "react";
import type {Dependencies} from "@src/modules/shared/dependencies/dependenciesContainer.ts";

export const DependenciesContext = createContext<Dependencies | null>(null);

interface DependenciesProviderProps {
    dependencies: Dependencies;
    children: ReactNode;
}

export const DependenciesProvider = ({ dependencies, children }: DependenciesProviderProps) => (
    <DependenciesContext value={dependencies}>
        {children}
    </DependenciesContext>
);
```

### useDependencies Hook

```typescript
// src/modules/shared/dependencies/useDependencies.ts
import { use } from "react";
import { DependenciesContext } from "@src/modules/shared/dependencies/dependencies.provider.tsx";
import type {Dependencies} from "@src/modules/shared/dependencies/dependenciesContainer.ts";

export const useDependencies = (): Dependencies => {
    const dependencies = use(DependenciesContext);
    if (dependencies === null) {
        throw new Error("useDependencies must be used within a DependenciesProvider");
    }
    return dependencies;
};
```

### Page

```tsx
// src/modules/shared/ui/pages/StartRegisterEmptyOrderPage.tsx
import { StartRegisterEmptyOrder } from "@src/modules/orderRegistration/startRegisterEmptyOrder/startRegisterEmptyOrder.component.tsx";

export function StartRegisterEmptyOrderPage() {
    return <StartRegisterEmptyOrder />;
}
```

### Router

```tsx
// src/router.tsx
import { createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import { RootLayout } from "@src/modules/shared/ui/layout/RootLayout.tsx";
import { StartRegisterEmptyOrderPage } from "@src/modules/shared/ui/pages/StartRegisterEmptyOrderPage.tsx";

const rootRoute = createRootRoute({
    component: RootLayout,
});

const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => <div>Accueil</div>,
});

const startRegisterEmptyOrderRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/commandes/creer",
    component: StartRegisterEmptyOrderPage,
});

export const routeTree = rootRoute.addChildren([indexRoute, startRegisterEmptyOrderRoute]);
export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
    interface Register {
        router: typeof router;
    }
}
```

### Test Router Helper

```typescript
// src/modules/shared/test/createTestRouter.ts
import { createMemoryHistory, createRouter } from "@tanstack/react-router";
import { routeTree } from "@src/router.tsx";

export const createTestRouter = (entryUrl: string) => {
    const memoryHistory = createMemoryHistory({ initialEntries: [entryUrl] });
    return createRouter({ routeTree, history: memoryHistory });
};
```

### RootLayout

```tsx
// src/modules/shared/ui/layout/RootLayout.tsx
import { Outlet } from "@tanstack/react-router";
import { Toaster } from "sonner";

export function RootLayout() {
    return (
        <>
            <Toaster position="top-center" />
            <main>
                <Outlet />
            </main>
        </>
    );
}
```

### UUID Helper

```typescript
// src/modules/shared/uuid.ts
import { v4 as uuidv4 } from 'uuid';

export const generateUUID = (): UUID => {
    return uuidv4() as UUID;
};

export type UUID = `${string}-${string}-${string}-${string}-${string}`;
```

---

## Patterns clés pour les tests e2e

### Setup du driver e2e

Chaque driver e2e suit ce pattern :
1. **`givenSystemIsOperationnal()`** : Démarre un container PostgreSQL via testcontainers, configure les variables d'environnement, crée l'application NestJS avec `Test.createTestingModule`, applique le prefix `api`, et initialise l'app
2. **`when...()`** : Effectue une requête HTTP via `supertest` sur `this.app.getHttpServer()`
3. **`then...()`** : Vérifie le status HTTP de la réponse + l'état de la base de données via `this.app.get(DataSource).query(...)`
4. **`cleanup()`** : Ferme l'app NestJS et arrête le container PostgreSQL

### Vérification en base de données

Pour vérifier l'état en base, utiliser le `DataSource` TypeORM :
```typescript
const dataSource = this.app.get(DataSource);
const rows = await dataSource.query('SELECT * FROM table_name');
```

---

## Commandes utiles

```bash
# Backend — Lancer un test unitaire spécifique
cd backend && npx vitest run <chemin-du-spec>

# Backend — Lancer un test e2e spécifique
cd backend && npx vitest run --config vitest.e2e.config.ts <chemin-du-spec>

# Backend — Tous les tests unitaires
cd backend && npm run test:unit

# Backend — Tous les tests e2e
cd backend && npm run test:e2e

# Frontend — Vérification TypeScript
cd frontend && npx tsc --noEmit

# Frontend — Tests UI integration
cd frontend && npm run test:ui-integration
```
