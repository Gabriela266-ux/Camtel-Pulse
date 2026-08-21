# Directives Backend — API à implémenter pour le Frontend "Financial Pulse"

> Document transmis à la personne chargée du backend (Express / Sequelize).
> Le frontend consomme déjà ces endpoints ; il suffit de les créer côté backend selon les contrats ci-dessous.
> Conventions à respecter : **mêmes** routes protégées (JWT `Authorization: Bearer`), RBAC + scope, et réponse `{ ok: boolean, data?, message? }` que les routes existantes.

---

## 1. `GET /api/operationnels`

- **Rôles autorisés** : `ADMIN`, `MANAGER`, `CHEF_OPE` (un `OPERATIONNEL` ne reçoit que son propre profil).
- **Objectif** : retourner la liste des utilisateurs de rôle opérationnel rattachés au centre de l'utilisateur authentifié.
- **Réponse attendue** (`data`) :
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
> Le champ `id` peut être renvoyé comme nombre ou string ; le frontend le manipule en `string` (type `Operationnel.id`).

---

## 2. `GET /api/affectations`

- **Rôles autorisés** : `ADMIN`, `MANAGER`, `CHEF_OPE`.
- **Route** : retourner la correspondance **opérationnel ↔ partenaire / DSPM / POS** pour alimenter la carte "Suivi opérationnel" du Chef et la vue.
- **Réponse attendue** (`data`) :
```json
[
  {
    "userId": "5",
    "nomComplet": "M. XYZ",
    "partenaireId": "22222222-2222-4222-8222-222222222222",
    "partenaireNom": "Glotelho",
    "dsmId": "33333333-3333-4333-8333-333333333333",
    "posId": "...
  }
]
```
> `userId`, `dsmId`, `posId` optionnels. Le frontend convertit `userId` en `string` (type `OperationalAssignment.userId`).

---

## 3. `POST /api/partenaires`

- **Rôles autorisés** : `ADMIN`, `CHEF_OPE` uniquement.
- **Objectif** : créer un **partenaire** (DA / client), puis l'attribuer **soit à un opérationnel**, soit directement au **chef connecté** ("Gérer moi-même").
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
- **Réponse attendue** (`data`) : `{ "id": "...", "nom": "Nouveau Partenaire" }`.

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
  role?: 'OPERATIONNEL';
  partenaireId?: string | null;
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

---

> 📌 **Dernière version de référence** : voir `Directives_API_Backend.md` à la racine du projet
> (inclus état d'implémentation, agrégats `ProgressIndicators` et note ModificationsPage).