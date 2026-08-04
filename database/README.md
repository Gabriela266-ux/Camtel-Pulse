# Camtel-Pulse — Base de données (Conception Merise + PostgreSQL)

> **Projet** : Camtel-Pulse — Application de suivi des objectifs commerciaux
> (Glotelho & Master Color) — Centre 1 CDPSM — Camtel
> **Pôle** : database — branche `database`

---

## 1. Contenu du dossier `database/`

| Livrable | Fichier | Description |
|---|---|---|
| 1 | `01_dictionnaire_donnees.md` | Dictionnaire des données : entités, attributs, types, domaines |
| 2 | `02_regles_gestion.md` | Règles de gestion formalisées (RG-01 → RG-41) |
| 3 | `03_mcd.md` | Modèle Conceptuel des Données (diagramme Mermaid) |
| 4 | `04_mld.md` | Modèle Logique des Données (relations normalisées) |
| 5 | `05_mpd.md` | Modèle Physique des Données PostgreSQL |
| 6 | `06_schema.sql` | **Script SQL complet à exécuter dans pgAdmin** |
| 7 | `README.md` | Ce document — synthèse, choix, comparaison des visions |

---

## 2. Synthèse du modèle retenu

```
entites (Centre/Client/DSM/POS)  ──< parent_id >── entites (auto-référence)
    │
    │ entite_id
    ▼
saisies_journalieres ──< saisie_par >── utilisateurs
    │
    └── config_generale (paramètres globaux)
```

**4 tables** :
1. **`entites`** — hiérarchie commerciale unifiée (type : centre, client, dsm, pos)
2. **`saisies_journalieres`** — vente du jour par entité (le cumul/écarts sont recalculés)
3. **`utilisateurs`** — comptes d'accès (rôles agent / admin)
4. **`config_generale`** — paramètres métier évolutifs

**2 vues** : `v_entites_avec_parent` (arborescence), `v_suivi_journalier` (cumul par fenêtre).

---

## 3. Règles de gestion clés (rappel)

| Règle | Formule / contenu |
|---|---|
| Stock de sécurité (client) | `(Objectif mensuel ÷ 31) × 3` |
| Répartition DSM/POS | Parts égales (décision validée) |
| Achats cumulés | `cumul(J) = cumul(J−1) + vente(J)` |
| Écart du jour | `vente du jour − stock de sécurité` |
| Écart cumulé | `achats cumulés − stock de sécurité` |
| Alerte | Écart négatif → rouge ; positif ou nul → verte |

> Les cumuls et écarts **ne sont pas stockés** (conformité documents) — ils sont recalculés côté backend Node.js/Express.

---

## 4. Comparaison des visions documentaires

| Aspect | Document Structuration (vision initiale) | Modèle final retenu (ce dossier) | Justification |
|---|---|---|---|
| Modèle | 4 tables : `clients`, `dsm`, `pos`, `saisies_journalieres` (FK polymorphe `entite_id` + `type_entite`) | 1 table unifiée `entites` + `saisies_journalieres` | FK polymorphe = pas d'intégrité référentielle réelle ; table unifiée = vraie FK, agrégation hiérarchique native, évolutif |
| Saisies | `saisies_journalieres(id, entite_id, type_entite, date, vente_jour)` | `saisies_journalieres(id, entite_id BIGINT FK, date_saisie, vente_jour)` | FK réelle vers `entites`, unicité `(entite_id, date_saisie)` |
| Cumul/écarts | Non stockés, recalculés | Non stockés, recalculés (+ vue `v_suivi_journalier`) | Conformité totale |
| Recherche | Par identifiant non défini | Code unique `CLT-001` / `DSM-001` / `POS-001` | Décision validée |
| Sécurité | Non évoquée | Table `utilisateurs` avec rôles | Décision validée (document Contexte : point ouvert) |
| Nom projet | Camtel-pro (CDC) / Camtel-Pulse (Contexte) | **Camtel-Pulse** | Décision validée |

---

## 5. Justification du modèle unifié `entites`

1. **Intégrité référentielle** : le modèle 4 tables du document repose sur une FK polymorphe (`entite_id` + `type_entite`), que PostgreSQL ne peut pas contraindre réellement. Le modèle unifié utilise une vraie FK auto-référente.
2. **Agrégation hiérarchique (RG-32)** : POS → DSM → Client → Centre se fait par récursivité/self-JOIN naturelle.
3. **Évolutivité (RG-36)** : ajout de DSM/POS, voire de nouveaux centres, sans refonte.
4. **Attributs conditionnels** : `objectif_mensuel` et `master_sim` sont réservés aux clients ; leur caractère conditionnel est encadré par CHECK côté SGBD et par la logique applicative côté backend.
5. **Le document Structuration (Option A/B)** reste la source de la logique de calcul ; seul le stockage physique est unifié.

---

## 6. Exécution du script

1. Ouvrir **pgAdmin**.
2. Créer une base (ex. `camtel_pulse`) : clic droit → **Create → Database**.
3. Ouvrir le **Query Tool** de cette base.
4. Ouvrir le fichier `06_schema.sql` (bouton **Open File** ⚠ ou coller le contenu).
5. Exécuter (F5).
6. Vérifier : 4 tables, 2 vues, 1 trigger, données initiales (Centre, Glotelho, Master Color).

```sql
-- Vérification rapide après exécution
SELECT * FROM entites ORDER BY id;
SELECT * FROM config_generale;
SELECT * FROM v_entites_avec_parent;
```

---

## 7. Prochaines étapes (backend/frontend)

- **Backend Node.js/Express** : exposer les API (recherche par `code_identifiant`, saisie journalière, calcul du cumul/écarts/stock de sécurité, agrégation hiérarchique).
- **Stock de sécurité (RG-10/RG-11)** : calcul côté backend (31 jours, 3 jours de couverture) — répartition à parts égales.
- **Frontend React** : barre de recherche, cartes d'indicateurs, jauges rouge/vert, graphique 7 jours, tableau journalier (maquette validée).
- **Auth** : JWT + bcrypt sur la table `utilisateurs`.

---

## 8. Points de vigilance

- La règle de répartition à parts égales est **provisoire** (point à valider avec l'encadreur) : elle est câblée dans la logique applicative, pas dans le schéma, donc facile à modifier.
- `master_sim` et `code_identifiant` sont **UNIQUE** : la génération des codes côté application doit être robuste (séquences par type) pour éviter tout conflit.
- Les montants sont en **NUMERIC(14,2)** (FCFA) : utiliser des entiers ou NUMERIC en backend pour éviter les erreurs d'arrondi.

