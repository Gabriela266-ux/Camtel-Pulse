# API Camtel Pulse

Base URL locale : `http://localhost:5000`

## 1. Santé du backend

### GET /api/health
Vérifie que l’API est active.

Exemple :
```http
GET http://localhost:5000/api/health
```

---

## 2. Authentification

### POST /api/auth/login
Connexion utilisateur.

Body :
```json
{
  "email": "admin@camtel.local",
  "password": "admin123"
}
```

Retour attendu :
```json
{
  "ok": true,
  "token": "...",
  "user": {
    "id": "user-admin-1",
    "name": "Admin principal",
    "email": "admin@camtel.local",
    "role": "admin",
    "centerId": "center-1",
    "status": "active"
  }
}
```

### GET /api/auth/me
Retourne les informations de l’utilisateur connecté.

Header requis :
```http
Authorization: Bearer <token>
```

---

## 3. Organisation
Routes protégées.

### GET /api/organization/centers
### GET /api/organization/clients
### GET /api/organization/dsms
### GET /api/organization/pos

Exemple :
```http
GET http://localhost:5000/api/organization/centers
Authorization: Bearer <token>
```

---

## 4. Ventes
Routes protégées.

### GET /api/sales/dashboard
### GET /api/sales/records
### POST /api/sales/records

Exemple de body pour POST /api/sales/records :
```json
{
  "posId": "pos-1",
  "day": "2026-08-10",
  "forecast": 25000,
  "realization": 22000,
  "followUp": 18000
}
```

---

## 5. Business / KPI
Routes protégées.

### GET /api/business/organization/tree
### GET /api/business/organization/summary
### GET /api/business/dashboard
### GET /api/business/security-stock

Exemple :
```http
GET http://localhost:5000/api/business/security-stock?monthlyGoal=500000&daysCount=30
Authorization: Bearer <token>
```

---

## 6. Saisie
Routes protégées.

### POST /api/saisies
Body :
```json
{
  "id_pos": "pos-1",
  "date": "2026-08-10",
  "vente_jour": 15000
}
```

### GET /api/saisies
Paramètres optionnels :
- `entite`

Exemple :
```http
GET http://localhost:5000/api/saisies?entite=pos
Authorization: Bearer <token>
```

---

## 7. Dashboard & alertes
Routes protégées.

### GET /api/dashboard/calendar/:entityType/:entityId
### GET /api/dashboard/alerts/:type/:entityId
### GET /api/dashboard/audit

Exemples :
```http
GET http://localhost:5000/api/dashboard/calendar/pos/pos-1
GET http://localhost:5000/api/dashboard/alerts/pos/pos-1
GET http://localhost:5000/api/dashboard/audit?entite=pos
```

---

## 8. Corrections
Routes protégées.

### GET /api/corrections
### POST /api/corrections
### PATCH /api/corrections/:id/validate

Exemple de body pour POST /api/corrections :
```json
{
  "type": "vente",
  "entityId": "pos-1",
  "oldValue": 15000,
  "newValue": 18000,
  "reason": "Correction de saisie"
}
```

---

## 9. Objectifs
Routes protégées.

### GET /api/objectifs/:type
### PATCH /api/objectifs/:type/:id

Exemples :
```http
GET http://localhost:5000/api/objectifs/pos?parentId=dsm-1
PATCH http://localhost:5000/api/objectifs/pos/pos-1
Authorization: Bearer <token>
```

---

## 10. Import CSV
Routes protégées.

### POST /api/import/csv
Body :
```json
{
  "content": "col1,col2\nval1,val2"
}
```

---

## 11. Comptes

### POST /api/accounts/request
Demande de création de compte.

Body :
```json
{
  "name": "Jean Dupont",
  "email": "jean@example.com",
  "role": "operational",
  "centerId": "center-1"
}
```

### GET /api/accounts/pending
Routes protégées.

### PATCH /api/accounts/:id/approve
Routes protégées.

---

## 12. Routes avancées
Routes protégées.

### GET /api/advanced/calendar/:entityType/:entityId
### GET /api/advanced/summary
### GET /api/advanced/carry-over
### POST /api/advanced/admin-only

Exemple :
```http
GET http://localhost:5000/api/advanced/carry-over?previousBalance=50000&objectiveMensuel=300000
Authorization: Bearer <token>
```

---

## Ordre conseillé pour tester

1. GET /api/health
2. POST /api/auth/login
3. GET /api/auth/me
4. GET /api/organization/centers
5. GET /api/sales/dashboard
6. POST /api/saisies
7. GET /api/saisies
8. GET /api/dashboard/audit
9. POST /api/import/csv
10. GET /api/business/security-stock
11. Tester /api/advanced/admin-only avec un compte admin

---

## Références utiles

- Toutes les routes protectrices utilisent un JWT dans l’en-tête :
```http
Authorization: Bearer <token>
```
- Codes HTTP importants :
  - `200` : OK
  - `201` : Créé
  - `400` : Requête invalide
  - `401` : Non authentifié
  - `403` : Accès interdit
  - `404` : Route introuvable

---

## Exemple de commande curl

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@camtel.local","password":"admin123"}'
```

---

## Notes

- Le backend est actuellement lancé localement sur le port `5000`.
- Les routes admin-only sont restreintes au rôle `admin`.
- Les données actuelles sont en mode démonstration via `seedData.js`.
