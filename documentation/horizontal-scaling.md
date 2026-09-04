# Déploiement horizontal de Camtel Pulse

## Architecture

```text
Navigateur
    |
    v
Nginx :8080
    |
    v
PM2 cluster : plusieurs processus Node
    |
    +--> MySQL partagé
    +--> Redis partagé : sessions JWT, cache, événements
```

## Docker Compose recommandé

Depuis la racine du projet :

```bash
docker compose -f docker-compose.scaled.yml up --build
```

L'application est disponible sur `http://localhost:8080`.

Le service backend lance les migrations puis PM2 en mode cluster. Le nombre de processus peut être fixé avec `WEB_CONCURRENCY`, par exemple :

```bash
WEB_CONCURRENCY=4 docker compose -f docker-compose.scaled.yml up --build
```

Avant une utilisation réelle, remplacer tous les mots de passe et secrets présents dans `docker-compose.scaled.yml` par des secrets d'environnement ou un gestionnaire de secrets.

## PM2 sans Docker

Le serveur doit utiliser une base MySQL partagée et un Redis partagé :

```bash
cd backend
npm ci
DB_DIALECT=mysql NODE_ENV=production npm run db:migrate
NODE_ENV=production DB_DIALECT=mysql REDIS_ENABLED=true npm run start:cluster
```

Le fichier `ecosystem.config.js` lance autant de processus que de coeurs disponibles avec `exec_mode: cluster`. Pour imposer quatre processus :

```bash
WEB_CONCURRENCY=4 npm run start:cluster
```

Nginx doit ensuite proxyfier `/api/` vers le port `5000` de la machine backend et servir le build du frontend.

## Pourquoi SQLite ne doit pas être utilisé en horizontal

SQLite stocke les écritures dans un fichier local. Plusieurs processus ou plusieurs conteneurs ne partagent pas correctement ce fichier dans une architecture distribuée. En production, configurer :

- `DB_DIALECT=mysql` ;
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` ;
- `REDIS_ENABLED=true` ;
- `REDIS_URL` vers le Redis partagé.

## Redis

Les JWT restent vérifiables par chaque instance avec le même `JWT_SECRET`. Chaque connexion crée une session Redis avec expiration. Le middleware vérifie la session partagée et peut refuser une session révoquée ou expirée.

Le module Redis fournit également :

- des clés de cache préfixées `camtel:cache:` ;
- des sessions préfixées `camtel:session:` ;
- la publication d'événements sur les canaux préfixés `camtel:`.

La route `/api/health` expose l'état Redis pour les sondes de supervision.

## Contrôles obligatoires avant production

- même `JWT_SECRET` sur toutes les instances ;
- MySQL partagé et sauvegardé ;
- Redis partagé avec persistance et contrôle d'accès ;
- TLS entre le navigateur, Nginx et les services sensibles ;
- secrets hors du dépôt Git ;
- health checks sur Nginx, backend, MySQL et Redis ;
- logs centralisés ;
- stratégie de sauvegarde et restauration testée.

## Test de charge

Installer k6, démarrer la stack, puis exécuter :

```bash
BASE_URL=http://localhost:8080 RPS=100 DURATION=60s npm --prefix backend run load:k6
k6 run -e VUS=5000 -e DURATION=60s load-tests/socket.js
```

Le scénario API vérifie 100 requêtes par seconde pendant une minute par défaut. Augmenter `RPS` jusqu'à 500 pour le scénario demandé. Le scénario WebSocket nécessite un jeton Socket.IO réel si le middleware d'authentification est activé en environnement de test; il faut donc compléter le script avec un token de test injecté de manière sûre avant d'annoncer 5 000 connexions authentifiées.

À mesurer : taux d'erreur, p95/p99, saturation du pool MySQL, CPU/mémoire Node, latence Redis, connexions WebSocket, et débit des saisies/ventes. Un test de santé seul ne valide pas la capacité du dashboard ou des écritures métier.
