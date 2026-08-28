# Directives Backend — API à implémenter pour le Frontend « Financial Pulse »

> Document destiné à la personne chargée du backend (Express / Sequelize).
> Le frontend consomme déjà ces endpoints ; il suffit de les créer côté backend selon les contrats ci-dessous.
>
> ⚠️ **État actuel** : les trois endpoints du dossier `frontend/src/api/services.ts` (`getOperationnels`, `getAffectations`, `creerPartenaire`) ne sont **pas encore implémentés** dans `backend/src/app.js`. Ils sont requis par la console d'administration et la vue Chef opérationnel.

---

## Conventions à respecter

- Routes protégées par JWT (`Authorization: Bearer <token>`), comme les routes existantes.
- RBAC + scope selon le centre de l'utilisateur authentifié (`req.user.centerId`).
- Réponse au format `{ ok: boolean, data?, message? }`, identique aux routes existantes.
- Les identifiants peuvent être renvoyés en `number` ou `string` ; le frontend les manipule en `string`.

---

## 1. `GET /api/operationnels`

- **Rôles autorisés** : `ADMIN`, `MANAGER`, `CHEF_OPE` (un `OPERATIONNEL` ne reçoit que son propre profil).
- **Objectif** : retourner la liste des utilisateurs de rôle opérationnel rattachés au centre de l'utilisateur authentifié.
- **Réponse attendue** dans `data` :

```json
[
  {
    "id": "7",
    "nom_complet": "Marc A.",
    "email": "marc@example.com",
    "role": "OPERATIONNEL",
    "partenaireId": "22222222-2222-4222-8222-222222222222"
  }
]
```

> `roll`/`email` optionnels. `partenaireId` optionnel (null si non affecté).

---

## 2. `GET /api/affectations`

- **Rôles autorisés** : `ADMIN`, `MANAGER`, `CHEF_OPE`.
- **Objectif** : renvoyer la correspondance **opérationnel ↔ partenaire / DSM / POS** pour alimenter la carte « Suivi opérationnel » du Chef opérationnel.
- **Réponse attendue** dans `data` :

```json
[
  {
    "userId": "5",
    "nomComplet": "M. XYZ",
    "partenaireId": "22222222-2222-4222-8222-222222222222",
    "partenaireNom": "Glotelho",
    "dsmId": "33333333-3333-4333-8333-333333333333",
    "posId": "44444444-4444-4444-8444-444444444444"
  }
]
```

> `userId`, `dsmId`, `posId` optionnels ; `partenaireNom` affiché dans le périmètre.

---

## 3. `POST /api/partenaires`

- **Rôles autorisés** : `ADMIN`, `CHEF_OPE` uniquement.
- **Objectif** : créer un **partenaire** (DA / client), puis l'attribuer **soit à un opérationnel** (`OPERATIONNEL`), **soit directement au chef connecté** (`CHEF` = « Gérer moi-même »).
- **Body attendu** :

```json
{
  "nom": "Nouveau Partenaire",
  "masterSim": "SIM-X-0001",
  "attribution": { "type": "OPERATIONNEL", "userId": "7" }
}
```

ou

```json
{
  "nom": "Nouveau Partenaire",
  "attribution": { "type": "CHEF" }
}
```

- **Comportement à implémenter** :
  1. Créer l'entité partenaire (avec `master_sim` optionnel).
  2. Si `attribution.type === 'OPERATIONNEL'` : vérifier que l'opérationnel existe et appartient au centre, puis l'affecter à ce partenaire (scope).
  3. Si `attribution.type === 'CHEF'` : affecter le partenaire au **Chef opérationnel connecté** comme responsable direct.
- **Réponse attendue** dans `data` : `{ "id": "...", "nom": "Nouveau Partenaire" }`.

---

## 4. (Donnée %) — Indicateurs de progression (aucune route à créer)

Les agrégats nécessaires au composant `ProgressIndicators.tsx` sont **déjà** renvoyés par les endpoints existants :

- `AchatTotal` = somme de `record.achat` renvoyés par `GET /api/dashboard/records`.
- `ObjectifTotalCalendrierAchat` = somme de `record.prevision_ca` renvoyés par `GET /api/dashboard/records`.
- `ObjectifMensuel` = `kpi.objectif_mensuel` renvoyé par `GET /api/dashboard`.

Aucune route supplémentaire n'est nécessaire pour ces trois valeurs.

---

## 5. (Note) — ModificationsPage

La page `ModificationsPage.tsx` utilise encore un tableau de données d'exemple locale (`mockModifications`). La route backend `GET /api/dashboard/audit` **existe déjà** mais n'est pas encore consommée par le frontend. Pour finaliser cette page sans mock, il est demandé au backend de garantir que `/api/dashboard/audit` renvoie la liste des événements réels (DSM/POS ajoutés, saisies, corrections, affectations) au format :

```json
{
  "id": 1,
  "date": "2026-08-13T09:25:00",
  "auteur": "Marc A.",
  "roleAuteur": "CHEF_OPE",
  "type": "OPERATIONNEL_AFFECTE",
  "partenaireId": 102,
  "partenaire": "Master Color",
  "entite": "Mme Ngono",
  "detail": "Un opérationnel a été affecté au partenaire Master Color.",
  "statut": "EFFECTUEE"
}
```

---

## 6. (Donnée %) — Vue Opérationnel `RoleWorkspace` (grille 3 cartes)

La vue Opérationnel affiche désormais 3 cartes dynamiques. Deux valeurs dépendent des relevés journaliers déjà renvoyés par `GET /api/dashboard/records` :

- **Carte ACHAT** : statut du jour. Le frontend utilise `record.achat` du jour courant (`date = aujourd'hui`).
  - Si un relevé existe : affiche `{achat} U`.
  - Sinon : affiche `« À saisir »`.

Aucune route supplémentaire n'est requise pour la carte ACHAT.

### 6.1 Compteur CORRECTIONS (champ optionnel)

La carte **CORRECTIONS** doit afficher le nombre réel de demandes de correction en cours pour le périmètre de l'opérationnel connecté.

> **À implémenter côté backend** : enrichir la réponse de `GET /api/dashboard/records` (ou ajouter le champ `corrections`) avec un entier **optionnel** par jour.

Format attendu dans chaque objet `DailyRecord` :

```json
{
  "date": "2026-08-20",
  "achat": 120,
  "stock_journalier": 75,
  "consommation": 45,
  "statut": "NORMAL",
  "corrections": 2
}
```

- `corrections` = nombre de demandes de correction ouvertes/non résolues du jour.
- Champ **optionnel** : si absent, le frontend affiche `0` (il ne bloque pas le rendu et n'invente aucune valeur).

---

## 7. `PATCH /api/affectations/:userId` (bouton « Changer poste »)

- **Rôles autorisés** : `ADMIN`, `CHEF_OPE`.
- **Objectif** : modifier le périmètre (partenaire / DSM / POS) attribué à un opérationnel depuis la carte « Suivi opérationnel » du Chef.
- **Body attendu** :

```json
{
  "partenaireId": "22222222-2222-4222-8222-222222222222",
  "dsmId": "33333333-3333-4333-8333-333333333333",
  "posId": "44444444-4444-4444-8444-444444444444"
}
```

- **Réponse attendue** dans `data` :

```json
{
  "userId": "5",
  "nomComplet": "M. XYZ",
  "partenaireId": "22222222-2222-4222-8222-222222222222",
  "partenaireNom": "Glotelho",
  "dsmId": "33333333-3333-4333-8333-333333333333",
  "posId": "44444444-4444-4444-8444-444444444444"
}
```

> Tant que cet endpoint n'existe pas, le frontend **ne fabrique aucune donnée factice** : l'action « Changer poste » n'est pas câblée côté backend de façon destructive et le bouton reste présent comme demande d'API à implémenter.

---

## Rappel des types frontend consommés

```ts
export interface Operationnel {
  id: string;
  nom_complet: string;
  email?: string;
  role?: string;
  partenaireId?: string;
}

export interface AddPartnerPayload {
  nom: string;
  masterSim?: string;
  attribution: {
    type: 'OPERATIONNEL' | 'CHEF';
    userId?: string;
  };
}
```

_Méthodes consommées par le frontend (`src/api/services.ts`) :_

```
apiService.getOperationnels()  -> GET  /api/operationnels
apiService.getAffectations()   -> GET  /api/affectations
apiService.creerPartenaire(x)  -> POST /api/partenaires { body: x }
```