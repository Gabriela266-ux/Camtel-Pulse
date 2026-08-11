# Guide du dépôt GitHub — Camtel-pro

Ce document explique comment le dépôt **Camtel-pro** est organisé et comment
chaque membre de l'équipe doit travailler au quotidien avec Git et GitHub.

---

## 1. Vue d'ensemble

Le dépôt suit une stratégie à deux niveaux :

- **`main`** : branche stable et protégée. Elle représente toujours une
  version qui fonctionne. Personne ne pousse directement dessus.
- **`dev`** : branche d'intégration. Elle rassemble le travail de toute
  l'équipe avant qu'il ne soit validé vers `main`. Elle est protégée contre
  les push directs : on n'y arrive que via des Pull Requests (PR).
- **Branches de travail** : `frontend`, `backend`, `database`. Chaque membre
  développe sur la branche correspondant à son rôle, puis propose ses
  changements à `dev` via une PR.

```
main   ← reçoit dev quand dev est stable (PR validée)
 └── dev   ← reçoit les branches de travail (PR + review)
       ├── frontend
       ├── backend
       └── database
```

**Règle d'or : on ne travaille jamais directement sur `main` ni sur `dev`.**

---

## 2. Règles de protection à activer sur GitHub

Dans **Settings → Branches → Branch protection rules**, pour `main` et `dev` :

- Interdire le push direct (« Require a pull request before merging »)
- Exiger au moins une review avant fusion (« Require approvals » = 1)
- (Optionnel mais conseillé) Interdire de fusionner si la branche n'est pas
  à jour avec la cible

---

## 3. Convention de nommage

**Branches**
- `frontend`, `backend`, `database` : branches principales de chaque pôle
- Pour une tâche précise, créer une sous-branche depuis sa branche de pôle :
  `frontend/recherche-identifiant`, `backend/api-saisie-journaliere`, etc.

**Messages de commit**
Utiliser un préfixe qui indique le type de changement :
- `feat:` nouvelle fonctionnalité — ex. `feat: ajout du formulaire de saisie journalière`
- `fix:` correction de bug — ex. `fix: correction du calcul du cumul`
- `style:` mise en forme, sans changement de logique
- `refactor:` réorganisation du code sans changer le comportement
- `docs:` documentation
- `chore:` tâche technique (dépendances, configuration)

---

## 4. Installation initiale (à faire une seule fois)

```bash
# Cloner le dépôt
git clone https://github.com/<organisation>/Camtel-pro.git
cd Camtel-pro

# Se positionner sur dev pour partir de la bonne base
git checkout dev

# Configurer son identité (si pas déjà fait sur la machine)
git config --global user.name "Ton Nom"
git config --global user.email "ton.email@example.com"
```

---

## 5. Workflow quotidien

### Étape 1 — Se mettre à jour avant de commencer

```bash
git checkout dev
git pull origin dev
git checkout frontend      # ou backend / database
git merge dev              # récupère les dernières intégrations dans sa branche
```

### Étape 2 — Travailler et committer régulièrement

```bash
git status                 # voir les fichiers modifiés
git add .                  # ajouter les changements
git commit -m "feat: ajout du composant tableau journalier"
```

### Étape 3 — Pousser sa branche

```bash
git push origin frontend   # première fois : git push -u origin frontend
```

### Étape 4 — Proposer ses changements à `dev`

Sur GitHub :
1. Aller dans l'onglet **Pull requests**
2. **New pull request** : base = `dev`, compare = `frontend` (ou sa branche)
3. Décrire ce qui a été fait
4. Demander une review à un coéquipier
5. Une fois approuvée → **Merge**

### Étape 5 — Après fusion, se resynchroniser

```bash
git checkout dev
git pull origin dev
git checkout frontend
git merge dev
```

---

## 6. Commandes Git de base — mémo

| Action | Commande |
|---|---|
| Cloner le dépôt | `git clone <url>` |
| Voir les branches | `git branch -a` |
| Changer de branche | `git checkout <branche>` |
| Créer et basculer sur une nouvelle branche | `git checkout -b <nouvelle-branche>` |
| Voir l'état des fichiers | `git status` |
| Ajouter des fichiers à committer | `git add .` ou `git add <fichier>` |
| Créer un commit | `git commit -m "message"` |
| Envoyer ses commits | `git push origin <branche>` |
| Récupérer les derniers changements | `git pull origin <branche>` |
| Fusionner une branche dans la branche courante | `git merge <branche>` |
| Voir l'historique | `git log --oneline --graph --all` |
| Annuler des modifications non commitées | `git checkout -- <fichier>` |
| Voir les différences avant commit | `git diff` |

---

## 7. En cas de conflit lors d'un merge ou d'une PR

```bash
git status                 # liste les fichiers en conflit
```

1. Ouvrir chaque fichier en conflit : Git marque les zones avec
   `<<<<<<<`, `=======`, `>>>>>>>`.
2. Choisir/fusionner manuellement le bon contenu, puis supprimer ces marqueurs.
3. Une fois corrigé :

```bash
git add <fichier corrigé>
git commit
git push origin <branche>
```

En cas de doute sur un conflit important, en discuter avec l'équipe avant de
committer — ne jamais résoudre un conflit à la hâte sur du code qu'on ne
maîtrise pas.

---

## 8. Permissions et protection des branches (à faire une seule fois, par l'admin du dépôt)

Par défaut, GitHub n'active **aucune** protection : n'importe quel collaborateur en
écriture peut pousser directement sur `main`/`dev`, voire les supprimer. Il faut
donc le configurer explicitement.

### 8.1 Rôles des membres

Dans `Settings → Collaborators and teams` :

- **Admin / Maintain** : uniquement Félix (créateur et superviseur du dépôt).
- **Write** : tous les autres membres — suffisant pour travailler sur sa branche
  et ouvrir des Pull Requests, sans pouvoir changer les paramètres du dépôt.

### 8.2 Règles de protection de `main` et `dev`

Dans `Settings → Branches → Add branch protection rule`, pour **chacune** des
deux branches :

- ✅ Require a pull request before merging
- ✅ Require approvals (au moins 1)
- ✅ Restrict deletions (empêche la suppression de la branche)
- ✅ Restrict force pushes (empêche un `push --force` qui écraserait l'historique)
- ✅ Do not allow bypassing the above settings (optionnel, pour que même un admin passe par une PR)

### 8.3 Équivalent en ligne de commande (GitHub CLI)

```bash
gh api repos/<organisation>/Camtel-pro/branches/main/protection \
  --method PUT \
  --field required_pull_request_reviews[required_approving_review_count]=1 \
  --field enforce_admins=true \
  --field restrictions=null \
  --field allow_deletions=false \
  --field allow_force_pushes=false \
  --field required_status_checks=null
```

(Répéter en remplaçant `main` par `dev`.)

Pour repasser un membre en accès « écriture simple » :

```bash
gh api repos/<organisation>/Camtel-pro/collaborators/<nom-utilisateur> \
  --method PUT \
  --field permission=push
```

## 9. Bonnes pratiques à respecter

- Toujours faire `git pull` avant de commencer à coder.
- Committer souvent, par petites étapes logiques — pas un seul gros commit en fin de semaine.
- Ne jamais pousser directement sur `main` ou `dev`.
- Toujours passer par une Pull Request, même entre coéquipiers qui se font confiance.
- Décrire clairement ce que fait chaque PR pour faciliter la review.
- Fusionner `dev` dans `main` uniquement à des étapes stables (avant une démo, une soutenance, un rendu).
