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
apiService.getOperationnels()  -> GET  /api/operationnelles
apiService.getAffectations()   -> GET  /api/affectations
apiService.creerPartenaire(x)  -> POST /api/partenaires { body: x }
```