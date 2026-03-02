# Infra Doctor — Diagnostic infrastructure

Lance un diagnostic complet de l'infrastructure du projet. Exécute chaque étape de manière autonome et corrige les problèmes safe automatiquement.

---

## Étape 1 : ENV VALIDATION

- Lis tous les fichiers `docker-compose*.yml` et extrais chaque référence `env_file` et variable d'environnement
- Vérifie que chaque fichier `.env` référencé existe au bon chemin relatif (attention : les services tournent depuis des sous-dossiers, pas la racine)
- Cross-référence avec les fichiers de config (`ConfigModule`, `TypeOrmModule`) pour vérifier que les `envFilePath` correspondent aux fichiers réels
- Signale toute variable référencée dans le code mais absente des fichiers `.env`

## Étape 2 : DOCKER HEALTH

- Lance `docker compose --env-file .env.local -f docker-compose.dev.yml ps` et vérifie que tous les containers sont healthy
- Si un container est en restart ou unhealthy, lis ses logs (`docker compose logs {service} --tail 50`) et diagnostique
- Cherche les containers stale de configs précédentes : `docker ps -a --filter 'status=exited'`
- Vérifie qu'il n'y a pas de conflits de ports

## Étape 3 : DATABASE INTEGRITY

- Vérifie que `.gitignore` n'exclut PAS les fichiers de migration (`.sql` dans les dossiers migrations)
- Vérifie que tous les fichiers de migration TypeORM référencés dans la config existent sur le disque
- Teste la connexion à la base de données du container

## Étape 4 : CI/CD ALIGNMENT

- Lis `.github/workflows/*.yml` et vérifie que les images Docker, secrets et cibles de déploiement correspondent au `docker-compose` actuel
- Vérifie que la config nginx sert les bons services upstream
- Vérifie la cohérence entre les ports dans docker-compose, nginx et les variables d'environnement

## Étape 5 : REPORT

Produis un tableau markdown récapitulatif :

| Check | Status | Issue | Fix Applied |
|-------|--------|-------|-------------|

- Applique automatiquement les fixes safe (fichiers manquants, typos de config)
- Pour les fixes risqués, décris ce que tu ferais et attends l'approbation
- Mets à jour CLAUDE.md avec les gotchas infrastructure découverts

---

## Règles

- Ne modifie JAMAIS les fichiers `.env.local` ou les secrets sans approbation explicite
- Ne redémarre JAMAIS les containers Docker sans approbation explicite
- Privilégie le diagnostic et le rapport plutôt que les actions destructives
- Si un problème nécessite plus d'investigation, demande à l'utilisateur quel fichier consulter
