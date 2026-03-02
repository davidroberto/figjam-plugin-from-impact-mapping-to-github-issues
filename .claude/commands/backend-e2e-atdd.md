# Backend E2E ATDD - Workflow TDD pour tests end-to-end backend

Tu es en mode ATDD (Acceptance Test-Driven Development) pour les tests end-to-end backend.

Le but : partir d'un scénario Gherkin (Given/When/Then), écrire un test e2e qui échoue (RED), puis implémenter le minimum pour le faire passer (GREEN).

Les tests e2e démarrent l'application NestJS complète avec une base PostgreSQL via testcontainers, et testent via des requêtes HTTP.

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
   - Filtre : ne garde que les sub-issues avec `state: OPEN` **ET** `issueType.name == "Scenario / critère d'acceptation"` **ET** possédant le label `backend-e2e-test`
   - Les sub-issues sans le label `backend-e2e-test` ou d'un autre type (ex: "Technique") sont ignorées
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
- Le **contexte de la User Story parente** (si mode User Story) : son body peut contenir des règles métier, des contraintes techniques, des formats de données, des endpoints API qui s'appliquent à tous les scénarios

### Extraction du contexte du body

Le body des tickets (US parente et scénarios) peut contenir, en plus du Gherkin, des informations précieuses pour la génération des tests et du code :
- **Règles métier** : validations, formats, contraintes fonctionnelles, calculs
- **API** : endpoints, méthodes HTTP, formats de requête/réponse, codes HTTP attendus
- **Noms de domaine** : nommage des entités, des propriétés, des tables, des colonnes
- **Contraintes techniques** : types, structures de données, relations entre entités

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

1. Analyse le scénario Gherkin **ET le contexte complet du body** (règles métier, endpoints API, noms de domaine, codes HTTP — extraits à l'étape 0)
2. Identifie le module et la feature concernés dans `src/modules/`
3. **Utilise le contexte du body pour informer la génération** : les endpoints, les codes HTTP, les noms de tables/colonnes, les valeurs de test, les messages d'erreur doivent refléter ce qui est décrit dans le ticket (pas des valeurs inventées)
4. Génère **uniquement** les fichiers de test :
   - **DSL** (`test/{feature}.dsl.ts`) — interface du contrat de test (une interface par scénario). Si le fichier DSL existe déjà, ajoute la nouvelle interface.
   - **Driver** (`test/e2e/{feature}.e2eDriver.ts`) — implémentation e2e du DSL
   - **Spec** (`test/e2e/{feature}.e2e-spec.ts`) — le test
4. **NE PAS** modifier le code de prod à cette étape (ni entité, ni use case, ni controller, ni module)

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
2. Exécute le test avec `npx vitest run --config vitest.e2e.config.ts <chemin-du-spec>`
3. Le test **DOIT** échouer (RED) — que ce soit une erreur de compilation (import manquant, propriété inexistante) ou une erreur d'assertion, les deux sont acceptables en RED.

**ATTENTION : NE PAS passer à l'étape 5 (GREEN) sans avoir COMMITÉ le test à l'étape 4. Le commit du test RED est OBLIGATOIRE avant toute implémentation.**

---

## Etape 4 : Commit du test — OBLIGATOIRE AVANT GREEN

**BLOQUANT** — Cette étape est un pré-requis absolu pour passer à l'étape 5.

Seulement après RED confirmé :
- Propose un message de commit : `tech: backend: test e2e {nom du scénario} (#{id})`
- **STOP** — Demande validation du message de commit avec `AskUserQuestion`
- **Si validé** : commite
- **Si refusé** : ajuste le message et re-demande

**NE JAMAIS passer à l'étape 5 sans avoir exécuté cette étape.**

---

## Etape 5 : GREEN — Implémentation

Seulement après le commit du test (étape 4) :

1. **Lance le test** pour confirmer qu'il échoue (RED)
2. **Implémente le strict minimum** pour faire passer le test — sans code superflu, en respectant le contexte du body du ticket (endpoints, noms de domaine, règles métier, codes HTTP, etc.)
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
- **TOUJOURS** un `afterEach` avec `cleanup()` dans le spec pour arrêter l'app et le container
- **TOUJOURS** commiter le test RED (étape 4) AVANT de passer à l'implémentation GREEN (étape 5) — ne jamais sauter cette étape
- **JAMAIS** de modification de code de production en phase RED (étape 3) — ni scaffolding, ni propriété optionnelle, ni rien. Le test RED peut ne pas compiler, c'est normal.

---

## Architecture du projet

### Structure des fichiers

```
src/modules/{domain}/{feature}/
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
src/
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

## Code de référence — Feature "startRegisterEmptyOrder"

Voici le code complet de la feature existante `startRegisterEmptyOrder`. Utilise-le comme modèle pour tout nouveau test e2e.

### DSL (une interface par scénario)

```typescript
// src/modules/orderRegistration/startRegisterEmptyOrder/test/startRegisterEmptyOrder.dsl.ts
export interface SuccessfulCreationDSL {
  givenCreateOrderSystemIsOperationnal(): Promise<void> | void;
  givenUserIsNotAuthenticated(): void;
  whenUserCreatesOrder(): Promise<void>;
  thenOrderIsCreated(): void | Promise<void>;
}

export interface CreationDateRecordedDSL {
  givenUserIsNotAuthenticated(): void;
  givenCurrentDateIs(date: Date): void;
  whenUserCreatesOrder(): Promise<void>;
  thenOrderCreationDateIs(expectedDate: Date): void;
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

### Use Case

```typescript
// src/modules/orderRegistration/startRegisterEmptyOrder/startRegisterEmptyOrder.useCase.ts
import { Inject, Injectable } from '@nestjs/common';
import { UUID } from '@src/modules/shared/uuid/uuid';
import { Order } from '@src/modules/orderRegistration/order';
import { StartRegisterEmptyOrderOrderRepository } from '@src/modules/orderRegistration/startRegisterEmptyOrder/startRegisterEmptyOrder.orderRepository';
import { TypeOrmStartRegisterEmptyOrderOrderRepository } from '@src/modules/orderRegistration/startRegisterEmptyOrder/startRegisterEmptyOrder.typeOrmRepository';
import { DateTimeProvider } from '@src/modules/shared/dateTime/dateTimeProvider';
import { SystemDateTimeProvider } from '@src/modules/shared/dateTime/systemDateTimeProvider';
import { CommandResult } from '@src/modules/shared/result/commandResult';

export type StartRegisterEmptyOrderCommand = {
  orderId: UUID;
};

export type StartRegisterEmptyOrderError = never;

@Injectable()
export class StartRegisterEmptyOrderUseCase {
  constructor(
    @Inject(TypeOrmStartRegisterEmptyOrderOrderRepository)
    private orderRepository: StartRegisterEmptyOrderOrderRepository,
    @Inject(SystemDateTimeProvider)
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

### Entité (domaine)

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

### Repository (interface)

```typescript
// src/modules/orderRegistration/startRegisterEmptyOrder/startRegisterEmptyOrder.orderRepository.ts
import { Order } from '@src/modules/orderRegistration/order';

export interface StartRegisterEmptyOrderOrderRepository {
  save(order: Order): Promise<void>;
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

```typescript
// src/modules/shared/uuid/uuid.ts
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
# Lancer un test e2e spécifique
npx vitest run --config vitest.e2e.config.ts <chemin-du-spec>

# Lancer tous les tests e2e
npm run test:e2e

# Lancer tous les tests unitaires
npm run test:unit
```
