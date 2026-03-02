# UI Integration ATDD - Workflow TDD pour tests d'intégration UI

Tu es en mode ATDD (Acceptance Test-Driven Development) pour les tests d'intégration UI frontend.

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
   - Filtre : ne garde que les sub-issues avec `state: OPEN` **ET** `issueType.name == "Scenario / critère d'acceptation"` **ET** possédant le label `ui-test`
   - Les sub-issues sans le label `ui-test` ou d'un autre type (ex: "Technique") sont ignorées
   - Si aucune sub-issue éligible : informe l'utilisateur et arrête
   - Le cycle ATDD s'exécute en boucle sur chaque scénario

2. **Ticket GitHub (scénario unique)** : L'utilisateur fournit un numéro d'issue scénario (ex: `#48`)
   - Utilise `gh issue view <id> --json title,body` pour récupérer le ticket
   - Extrais la User Story et le scénario Gherkin depuis la description

3. **Manuel** : L'utilisateur fournit directement :
   - Un **nom de scénario**
   - Un **scénario** en format Gherkin (Etant donné / Quand / Alors)

**Après cette étape tu dois avoir** :
- Une **liste de scénarios** (1 ou plusieurs), chacun avec : numéro d'issue (ou nom), titre, body (contenant le Gherkin)
- Le **contexte de la User Story parente** (si mode User Story) : son body peut contenir des règles UI, des règles métier, des maquettes, des contraintes techniques qui s'appliquent à tous les scénarios

### Extraction du contexte du body

Le body des tickets (US parente et scénarios) peut contenir, en plus du Gherkin, des informations précieuses pour la génération des tests et du code :
- **Règles UI** : labels, placeholders, data-testid suggérés, messages d'erreur/succès, comportements visuels
- **Règles métier** : validations, formats, contraintes fonctionnelles
- **Maquettes / descriptions d'écran** : structure attendue du composant
- **Routes** : URL de la page
- **API** : endpoints à appeler

**Tu DOIS extraire et utiliser ces informations** dans les étapes suivantes. Ne te limite pas au Gherkin seul — le body entier est une source de vérité pour la génération.

---

## Boucle ATDD (si plusieurs scénarios)

Si mode User Story avec N sub-issues OPEN :

Pour chaque scénario (i de 1 à N) :
  - Affiche "--- Scénario {i}/{N} : #{number} — {title} ---"
  - Exécute les étapes 1 et 2 avec ce scénario
  - À la fin de l'étape 2, passe au scénario suivant

Si mode scénario unique ou manuel : exécute les étapes 1 et 2 une seule fois (comportement actuel).

---

## Etape 1 : RED — Génération du test

### 1.1. Analyse et génération

1. Analyse le scénario Gherkin **ET le contexte complet du body** (règles UI, messages, labels, routes, contraintes — extraits à l'étape 0)
2. Identifie le module et la feature concernés dans `src/modules/`
3. **Utilise le contexte du body pour informer la génération** : les data-testid, les textes affichés, les messages de toast, les labels de boutons, les placeholders, les routes de navigation doivent refléter ce qui est décrit dans le ticket (pas des valeurs inventées)
4. Génère **4 fichiers** :
   - **DSL** (`test/{feature}.dsl.ts`) — interface du contrat de test
   - **In-Memory Repository** (`test/{feature}.inMemoryRepository.ts`) — repository in-memory pour les tests
   - **Driver** (`test/ui-integration/{feature}.uiIntegrationDriver.tsx`) — implémentation UI du DSL
   - **Spec** (`test/ui-integration/{feature}.uiIntegration.spec.tsx`) — le test

**AUCUN CODE DE PROD NE DOIT ETRE ECRIT A CETTE ETAPE.**

**Règle YAGNI pour le repo in-memory** : en phase RED, le repo in-memory ne doit contenir **que** les méthodes de setup de test (ex: `givenOrderExists()`). Les méthodes du contrat repository (ex: `findOrderBeingRegistered()`) ne doivent **PAS** être implémentées en RED car rien ne les appelle encore. Elles seront ajoutées en GREEN quand le code de production en aura besoin. Le `implements InterfaceRepository` peut être déclaré (erreur d'import tolérée), mais sans implémenter les méthodes du contrat.

### 1.2. Vérification TypeScript

Exécute `npx tsc --noEmit` depuis `frontend/`.

Seules erreurs tolérées en phase RED :
- Import d'un composant/page qui n'existe pas encore
- Import de types spécifiques au composant à créer

**Toute autre erreur TypeScript doit être corrigée.**

### 1.3. Validation du test

**STOP** — Demande validation à l'utilisateur avec `AskUserQuestion` :
- Montre les fichiers générés (DSL, Driver, Spec)
- Confirme les erreurs d'import tolérées
- Attends l'approbation explicite

**Si refusé** : corrige selon le retour de l'utilisateur et re-demande validation.

### 1.4. Commit du test — OBLIGATOIRE AVANT GREEN

**BLOQUANT** — Cette étape est un pré-requis absolu pour passer à l'étape 2.

Seulement après validation du test :
- Propose un message de commit : `tech: frontend: test {nom du scénario} (#{id})`
- **STOP** — Demande validation du message de commit avec `AskUserQuestion`
- **Si validé** : commite
- **Si refusé** : ajuste le message et re-demande

**ATTENTION : NE PAS passer à l'étape 2 (GREEN) sans avoir COMMITÉ le test. Le commit du test RED est OBLIGATOIRE avant toute implémentation.**

---

## Etape 2 : GREEN — Implémentation

Seulement après le commit du test (étape 1.4) :

### 2.1. Implémentation

1. **Lance le test** (`npm run test:ui-integration`) pour confirmer qu'il échoue (RED)
2. **Implémente le strict minimum** pour faire passer le test, en respectant le contexte du body du ticket (labels, messages, structure de page, routes, etc.)
3. **Lance le test** pour confirmer qu'il passe (GREEN)
4. **Lance `npx tsc --noEmit`** pour vérifier la compilation

### 2.2. Validation de l'implémentation

**STOP** — Demande validation à l'utilisateur avec `AskUserQuestion` :
- Montre les fichiers créés/modifiés
- Attends l'approbation explicite

**Si refusé** : corrige selon le retour de l'utilisateur et re-demande validation.

### 2.3. Commit de l'implémentation

Seulement après validation de l'implémentation :
- Propose un message de commit : `feat: frontend: {nom du scénario} (#{id})`
- **STOP** — Demande validation du message de commit avec `AskUserQuestion`
- **Si validé** : commite
- **Si refusé** : ajuste le message et re-demande

---

## Règles strictes

- **JAMAIS** de code non couvert par un test
- **JAMAIS** d'anticipation de besoins futurs
- **JAMAIS** de "au cas où" ou de code défensif non demandé
- **TOUJOURS** le minimum pour faire passer le test
- **TOUJOURS** utiliser `data-testid` pour les sélecteurs
- **TOUJOURS** utiliser `userEvent` pour les interactions
- **TOUJOURS** utiliser `findBy` / `waitFor` pour les assertions asynchrones
- **TOUJOURS** commiter le test RED (étape 1.4) AVANT de passer à l'implémentation GREEN (étape 2) — ne jamais sauter cette étape

---

## Architecture du projet

### Structure des fichiers

```
src/modules/{domain}/{feature}/
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

- Les pages sont dans `src/modules/shared/ui/pages/`
- Les routes sont dans `src/router.tsx`
- Le layout racine avec `<Toaster />` est dans `src/modules/shared/ui/layout/RootLayout.tsx`

### Injection de dépendances

```
DependenciesProvider (React Context)
  └── useDependencies() hook
       └── renvoie les repositories injectés
```

- Container global : `src/modules/shared/dependencies/dependenciesContainer.ts`
- Container par feature : `src/modules/{domain}/{feature}/{feature}.dependenciesContainer.ts`

---

## Code de référence — Feature "startRegisterEmptyOrder"

Voici le code complet de la feature existante `startRegisterEmptyOrder`. Utilise-le comme modèle pour toute nouvelle feature.

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
            // ...new OtherFeatureDependenciesContainer().dependencies,
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

### UUID Helper

```typescript
// src/modules/shared/uuid.ts
import { v4 as uuidv4 } from 'uuid';

export const generateUUID = (): UUID => {
    return uuidv4() as UUID;
};

export type UUID = `${string}-${string}-${string}-${string}-${string}`;
```

### Page

```tsx
// src/modules/shared/ui/pages/StartRegisterEmptyOrderPage.tsx
import { StartRegisterEmptyOrder } from "@src/modules/orderRegistration/startRegisterEmptyOrder/startRegisterEmptyOrder.component.tsx";

export function StartRegisterEmptyOrderPage() {
    return <StartRegisterEmptyOrder />;
}
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

---

## Commandes utiles

```bash
# Vérification TypeScript
npx tsc --noEmit

# Tests UI integration
npm run test:ui-integration

# Récupérer un ticket GitHub
gh issue view <id> --json title,body
```
