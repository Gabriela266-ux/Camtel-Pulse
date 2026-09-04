# 02 — Règles de gestion — Camtel-Pulse

> Projet : **Camtel-Pulse** — Suivi des objectifs commerciaux des partenaires CAMTEL
> Règles formalisées à partir des documents fournis.

---

## A. Règles hiérarchiques (structure)

**RG-01 — Hiérarchie à 4 niveaux**
Le périmètre suivi s'organise selon 4 niveaux imbriqués : Centre (0) → Client (1) → DSM (2) → POS (3).

**RG-02 — Centre unique**
Il existe un seul Centre 1 CDPSM, racine de la hiérarchie. Toute entité est rattachée, directement ou indirectement, à ce centre.

**RG-03 — Rattachement client**
Un partenaire est rattaché au Centre. Un centre peut posséder plusieurs partenaires réels enregistrés dans la base.

**RG-04 — Rattachement DSM**
Un DSM est rattaché à un client. Un client possède plusieurs DSM.

**RG-05 — Rattachement POS**
Un POS est rattaché à un DSM. Un DSM possède plusieurs POS.

**RG-06 — Cardinalités**
- Client → Centre : plusieurs (N) pour 1
- DSM → Client : plusieurs (N) pour 1
- POS → DSM : plusieurs (N) pour 1

**RG-07 — Master SIM unique**
Chaque client possède une seule Master SIM. Deux clients ne peuvent pas partager la même Master SIM.

**RG-08 — Objectif mensuel par client**
Chaque client reçoit un objectif mensuel fixé par Camtel, exprimé en volume de vente (FCFA).

---

## B. Règles de calcul

**RG-10 — Stock de sécurité du client**
`Stock de sécurité (client) = (Objectif mensuel ÷ 31) × 3`
Ce seuil correspond à environ 3 jours d'objectif journalier moyen et sert de référence de seuil pour les alertes.

**RG-11 — Répartition du stock de sécurité vers DSM et POS**
Le stock de sécurité du client est réparti à **parts égales** entre les entités de même niveau (décision validée).
- Pour un DSM : `Stock_SS_DSM = Stock_SS_Client ÷ nombre_DSM_du_client`
- Pour un POS : `Stock_SS_POS = Stock_SS_DSM ÷ nombre_POS_du_DSM`

**RG-12 — Achats cumulés**
`Achats cumulés (J) = Achats cumulés (J−1) + Vente du jour (J)`
Le cumul s'incrémente automatiquement jour après jour à partir de l'historique des saisies.

**RG-13 — Écart du jour**
`Écart du jour = Vente du jour − Stock de sécurité`

**RG-14 — Écart cumulé**
`Écart cumulé = Achats cumulés − Stock de sécurité`

**RG-15 — Stock de sécurité statique sur le mois**
Le stock de sécurité est constant sur le mois pour une entité donnée (calculé une fois à partir de l'objectif mensuel).

---

## C. Règles d'alerte

**RG-20 — Alerte rouge**
L'écart (jour ou cumulé) est **négatif** → l'entité est en dessous de son stock de sécurité.

**RG-21 — Alerte verte**
L'écart (jour ou cumulé) est **positif ou nul** → l'entité est au niveau ou au-dessus de son stock de sécurité.

**RG-22 — Indépendance des alertes**
Les alertes « écart du jour » et « écart cumulé » sont **indépendantes** : une entité peut être en rouge sur le jour et en vert sur le cumul, ou inversement.

---

## D. Règles d'utilisation

**RG-30 — Saisie journalière**
La vente du jour est une saisie **manuelle quotidienne** de l'agent, par entité (client, DSM ou POS). Elle déclenche automatiquement la mise à jour du cumul, des écarts et de l'état d'alerte.

**RG-31 — Consultation par identifiant**
L'agent peut consulter le suivi de n'importe quelle entité (client, DSM ou POS) en saisissant son identifiant unique dans une barre de recherche.

**RG-32 — Agrégation hiérarchique**
La consultation d'une entité affiche ses indicateurs plus un agrégat remontant vers les niveaux supérieurs (POS → DSM → Client → Centre).

**RG-33 — Unicité de la saisie**
Une seule saisie journalière est possible par entité et par date (pas de doublon). Une re-saisie du même jour doit passer par une mise à jour.

**RG-34 — Vente non négative**
La vente du jour ne peut pas être négative (valeur ≥ 0).

**RG-35 — Sécurité d'accès**
Seul l'agent (et les personnes autorisées) peut saisir des données. L'accès passe par un compte utilisateur avec rôle.

**RG-36 — Évolutivité**
Le système doit pouvoir accueillir de nouveaux DSM ou POS sans refonte.

---

## E. Règles de recherche (identifiant)

**RG-40 — Format des identifiants (décision validée)**
Code unique auto-généré par type :
- Client : `CLT-001` … `CLT-999`
- DSM : `DSM-001` … `DSM-999`
- POS : `POS-001` … `POS-999`

**RG-41 — Vue par identifiant**
- Identifiant client → vue consolidée du client (avec ses DSM)
- Identifiant DSM → vue consolidée du DSM et de ses POS
- Identifiant POS → vue détaillée du point de vente

---

## F. Récapitulatif des règles de gestion

| Code | Libellé court |
|---|---|
| RG-01 | Hiérarchie à 4 niveaux (Centre/Client/DSM/POS) |
| RG-02 | Centre unique (Centre 1 CDPSM) |
| RG-03 | Client rattaché au Centre |
| RG-04 | DSM rattaché à un client |
| RG-05 | POS rattaché à un DSM |
| RG-06 | Cardinalités N/1 |
| RG-07 | Master SIM unique par client |
| RG-08 | Objectif mensuel par client |
| RG-10 | Stock de sécurité client = (objectif/31)×3 |
| RG-11 | Répartition à parts égales DSM/POS |
| RG-12 | Achats cumulés = cumul(J−1) + vente(J) |
| RG-13 | Écart du jour = vente − stock sécurité |
| RG-14 | Écart cumulé = cumul − stock sécurité |
| RG-15 | Stock de sécurité statique sur le mois |
| RG-20 | Alerte rouge : écart négatif |
| RG-21 | Alerte verte : écart positif ou nul |
| RG-22 | Alertes jour/cumulé indépendantes |
| RG-30 | Saisie journalière manuelle |
| RG-31 | Consultation par identifiant |
| RG-32 | Agrégation hiérarchique |
| RG-33 | Unicité saisie (entité, date) |
| RG-34 | Vente du jour ≥ 0 |
| RG-35 | Sécurité d'accès (comptes + rôles) |
| RG-36 | Évolutivité (ajout DSM/POS) |
| RG-40 | Format identifiants (CLT/DSM/POS-###) |
| RG-41 | Vue par identifiant |
