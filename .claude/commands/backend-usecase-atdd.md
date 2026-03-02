# Use Case ATDD - Workflow TDD pour tests unitaires de use case

Tu es en mode ATDD (Acceptance Test-Driven Development) pour les tests unitaires de use case backend.

Le but : partir d'un scénario Gherkin (Given/When/Then), écrire un test qui échoue (RED), puis implémenter le minimum pour le faire passer (GREEN).

---

## Etape 0 : Récupération du/des scénario(s)

**Demande à l'utilisateur** comment il souhaite fournir le scénario avec `AskUserQuestion` :

1. **User Story GitHub** : L'utilisateur fournit un numéro d'issue US (ex: `#32`)
   - Récupère le owner et repo via `gh repo view --json owner,name --jq '.owner.login + " " + .name'`
   - Utilise `gh api graphql` pour récupérer la US et ses sub-issues :
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
   - Affiche la liste des sub-issues trouvées (numéro, titre, état, type, labels)
   - Filtre : ne garde que les sub-issues avec `state: OPEN` **ET** `issueType.name == "Scenario / critère d'acceptation"` **ET** possédant le label `backend-usecase-test`
   - Les sub-issues sans le label `backend-usecase-test` ou d'un autre type (ex: "Technique") sont ignorées
   - Si aucune sub-issue éligible : informe l'utilisateur et arrête
   - Le cycle ATDD (étapes 1-7) s'exécute en boucle sur chaque scénario

2. **Ticket GitHub (scénario unique)** : L'utilisateur fournit un numéro d'issue scénario (ex: `#48`)
   - Utilise `gh issue view <id> --json title,body` pour récupérer le ticket
   - Extrais la User Story et le scénario Gherkin depuis la description

3. **Manuel** : L'utilisateur fournit directement :
   - Un **nom de scénario**
   - Un **scénario** en format Gherkin (Etant donné / Quand / Alors)

**Après cette étape tu dois avoir** :
- Une **liste de scénarios** (1 ou plusieurs), chacun avec : numéro d'issue (ou nom), titre, body (contenant le Gherkin)
- Le **contexte de la User Story parente** (si mode User Story) : son body peut contenir des règles métier, des contraintes techniques, des formats de données qui s'appliquent à tous les scénarios

### Extraction du contexte du body

Le body des tickets (US parente et scénarios) peut contenir, en plus du Gherkin, des informations précieuses pour la génération des tests et du code :
- **Règles métier** : validations, formats, contraintes fonctionnelles, calculs
- **Noms de domaine** : nommage des entités, des propriétés, des enums
- **API** : endpoints, formats de requête/réponse, codes HTTP
- **Contraintes techniques** : types, structures de données

**Tu DOIS extraire et utiliser ces informations** dans les étapes suivantes. Ne te limite pas au Gherkin seul — le body entier est une source de vérité pour la génération.

---

## Boucle ATDD (si plusieurs scénarios)

Si mode User Story avec N sub-issues OPEN :

Pour chaque scénario (i de 1 à N) :
  - Affiche "--- Scénario {i}/{N} : #{number} — {title} ---"
  - Exécute les étapes 1 à 7 avec ce scénario
  - À la fin de l'étape 7, passe au scénario suivant

Si mode scénario unique ou manuel : exécute les étapes 1 à 7 une seule fois (comportement actuel).

---

## Etape 1 : Écriture du test

1. Analyse le scénario Gherkin **ET le contexte complet du body** (règles métier, noms de domaine, formats, contraintes — extraits à l'étape 0)
2. Identifie le module et la feature concernés dans `src/modules/`
3. **Utilise le contexte du body pour informer la génération** : les noms d'entités, les propriétés, les valeurs de test, les messages d'erreur, les formats de données doivent refléter ce qui est décrit dans le ticket (pas des valeurs inventées)
4. Génère **uniquement** les fichiers de test :
   - **DSL** (`test/{feature}.dsl.ts`) — interface du contrat de test (une interface par scénario)
   - **In-Memory Repository** (`test/{feature}.inMemoryRepository.ts`) — repository in-memory pour les tests (si nécessaire)
   - **Driver** (`test/usecase/{feature}.useCaseDriver.ts`) — implémentation use case du DSL
   - **Spec** (`test/usecase/{feature}.useCase.spec.ts`) — le test
4. **NE PAS** modifier le code de prod à cette étape (ni entité, ni use case, ni enum/type)
5. **Règle YAGNI pour le repo in-memory** : en phase RED, le repo in-memory ne doit contenir **que** les méthodes de setup de test (ex: `givenOrderExists()`). Les méthodes du contrat repository (ex: `findById()`, `save()`) ne doivent **PAS** être implémentées en RED car rien ne les appelle encore. Elles seront ajoutées en GREEN quand le code de production en aura besoin.

---

## Etape 2 : Validation du test

**STOP** — Demande validation à l'utilisateur avec `AskUserQuestion` :
- Montre les fichiers de test générés/modifiés (DSL, Driver, Spec)
- Attends l'approbation explicite

**Si refusé** : corrige selon le retour de l'utilisateur et re-demande validation.

---

## Etape 3 : RED — Exécution du test

Seulement après validation du test :

1. **AUCUNE modification de code de production à cette étape.** Le test peut ne pas compiler — c'est normal et attendu en RED.
2. Exécute le test avec `npx vitest run <chemin-du-spec>`
3. Le test **DOIT** échouer (RED) — que ce soit une erreur de compilation (import manquant, propriété inexistante) ou une erreur d'assertion, les deux sont acceptables en RED.

**ATTENTION : NE PAS passer à l'étape 5 (GREEN) sans avoir COMMITÉ le test à l'étape 4. Le commit du test RED est OBLIGATOIRE avant toute implémentation.**

---

## Etape 4 : Commit du test — OBLIGATOIRE AVANT GREEN

**BLOQUANT** — Cette étape est un pré-requis absolu pour passer à l'étape 5.

Seulement après RED confirmé :
- Propose un message de commit : `tech: backend: test {nom du scénario} (#{id})`
- **STOP** — Demande validation du message de commit avec `AskUserQuestion`
- **Si validé** : commite
- **Si refusé** : ajuste le message et re-demande

**NE JAMAIS passer à l'étape 5 sans avoir exécuté cette étape.**

---

## Etape 5 : GREEN — Implémentation

Seulement après le commit du test (étape 4) :

1. **Lance le test** pour confirmer qu'il échoue (RED)
2. **Implémente le strict minimum** pour faire passer le test — sans code superflu, en respectant le contexte du body du ticket (noms de domaine, règles métier, formats, etc.)
3. **Lance le test** pour confirmer qu'il passe (GREEN)

---

## Etape 6 : Validation de l'implémentation

**STOP** — Demande validation à l'utilisateur avec `AskUserQuestion` :
- Montre les fichiers créés/modifiés
- Attends l'approbation explicite

**Si refusé** : corrige selon le retour de l'utilisateur et re-demande validation.

---

## Etape 7 : Commit de l'implémentation

Seulement après validation :
- Propose un message de commit : `feat: backend: {nom du scénario} (#{id})`
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
- **TOUJOURS** commiter le test RED (étape 4) AVANT de passer à l'implémentation GREEN (étape 5) — ne jamais sauter cette étape
- **JAMAIS** de modification de code de production en phase RED (étape 3) — ni scaffolding, ni propriété optionnelle, ni rien. Le test RED peut ne pas compiler, c'est normal.

---

## Architecture du projet

### Structure des fichiers

```
src/modules/{domain}/{feature}/
├── {feature}.useCase.ts                    # Use case (NestJS @Injectable)
├── {feature}.{entity}Repository.ts         # Interface repository
├── {entity}.ts                             # Entité (private constructor + factory create())
└── test/
    ├── {feature}.dsl.ts                    # Interfaces DSL (une par scénario)
    ├── {feature}.inMemoryRepository.ts     # Repository in-memory pour les tests
    ├── deterministicDateTimeProvider.ts    # DateTimeProvider déterministe (si besoin)
    └── usecase/
        ├── {feature}.useCase.spec.ts       # Spec du test
        └── {feature}.useCaseDriver.ts      # Drivers (un par scénario)
```

### Modules partagés

```
src/modules/shared/
├── dateTime/
│   └── dateTimeProvider.ts                 # Interface DateTimeProvider { now(): Date }
├── result/
│   └── commandResult.ts                    # CommandResult<E> (success/failure)
└── uuid/
    └── uuid.ts                             # generateUUID() + type UUID
```

---

## Code de référence — Feature "startRegisterEmptyOrder"

Voici le code complet de la feature existante `startRegisterEmptyOrder`. Utilise-le comme modèle pour toute nouvelle feature.

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

export class Order {
  private constructor(
    readonly orderId: UUID,
    readonly creationDate?: Date,
  ) {}

  static create(orderId: UUID, creationDate: Date): Order {
    return new Order(orderId, creationDate);
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

## Commandes utiles

```bash
# Lancer un test spécifique
npx vitest run <chemin-du-spec>

# Lancer tous les tests unitaires
npm run test:unit
```
