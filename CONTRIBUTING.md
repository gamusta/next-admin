# Guide de contribution

Ce document décrit le workflow de développement collaboratif pour le projet SaaS Finance.

## 🎯 Philosophie

Nous adoptons une approche collaborative où chaque changement est :

- **Planifié** : Réflexion avant action
- **Isolé** : Une branche par feature/fix
- **Reviewé** : Validation qualité systématique
- **Documenté** : Code compréhensible et maintenable

## 🔄 Workflow Git

### 1. Branches

#### Convention de nommage

```
<type>/<description-courte>-<sessionId>

Exemples :
- claude/add-user-authentication-013vXPVu7tBeA2esGzo8TURz
- claude/fix-invoice-calculation-013vXPVu7tBeA2esGzo8TURz
- feature/add-export-pdf
- fix/supplier-form-validation
```

#### Types de branches

- `claude/*` : Développements assistés par Claude (sessionId obligatoire)
- `feature/*` : Nouvelles fonctionnalités
- `fix/*` : Corrections de bugs
- `refactor/*` : Refactoring sans changement fonctionnel
- `docs/*` : Documentation uniquement

### 2. Commits

#### Convention Conventional Commits

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types autorisés :**

- `feat` : Nouvelle fonctionnalité
- `fix` : Correction de bug
- `refactor` : Refactoring (sans changement fonctionnel)
- `docs` : Documentation
- `style` : Formatage (sans changement de code)
- `test` : Ajout/modification de tests
- `chore` : Tâches de maintenance (deps, config)

**Exemples :**

```bash
feat(quotes): add PDF export functionality
fix(invoices): correct tax calculation for EU clients
refactor(auth): simplify JWT token validation
docs(contributing): add git workflow documentation
chore(deps): update next to 16.1.0
```

#### Bonnes pratiques

- ✅ Commits atomiques (1 commit = 1 changement logique)
- ✅ Messages en anglais, descriptifs
- ✅ Référencer les issues si applicable (`fixes #123`)
- ❌ Pas de `git commit -m "fix"` ou `wip`

### 3. Pull Requests

#### Processus

1. **Créer la branche**
   ```bash
   git checkout -b feature/ma-feature
   ```

2. **Développer et committer**
   ```bash
   git add .
   git commit -m "feat(scope): description"
   ```

3. **Push vers origin**
   ```bash
   git push -u origin feature/ma-feature
   ```

4. **Créer la PR** sur GitHub
  - Utiliser le template (voir `.github/pull_request_template.md`)
  - Remplir Summary, Changes, Test Plan
  - Assigner un reviewer

5. **Code Review** (voir DEVELOPMENT.md)
  - Le reviewer commente et valide
  - Corrections si nécessaire
  - Approbation finale

6. **Merge**
  - Squash and merge (commits condensés)
  - Supprimer la branche après merge

## 🤝 Collaboration Claude/Développeur

### Mode "Appropriation du code"

Ce mode vous permet de **maîtriser chaque ligne de code** :

#### Rôle de Claude

1. ✅ Crée la branche
2. ✅ Propose le code dans des blocs
3. ✅ Fournit le message de commit
4. ✅ Fait la code review

#### Votre rôle

1. 👁️ **Lisez** le code proposé
2. ✋ **Copiez** et intégrez manuellement
3. 🧠 **Comprenez** ce qui est fait
4. 💾 **Committez** avec le message fourni
5. 📤 **Pushez** sur la branche

#### Exemple de session

```bash
# Claude crée la branche
git checkout -b claude/add-pdf-export-013vXPVu7tBeA2esGzo8TURz

# Vous intégrez le code proposé par Claude
# (copier/coller dans votre éditeur)

# Vous committez
git add .
git commit -m "feat(quotes): add PDF export with company branding"

# Vous pushez
git push -u origin claude/add-pdf-export-013vXPVu7tBeA2esGzo8TURz

# Claude fait la review et suggère des améliorations si besoin
```

### Avantages

- 🎓 Vous **apprenez** en manipulant le code
- 👁️ Vous **validez** chaque changement
- 🔍 Vous **comprenez** la logique
- 💪 Vous **maîtrisez** votre codebase

## 🚫 Anti-patterns à éviter

❌ **Commit direct sur main** sans PR
❌ **Messages de commit vagues** ("fix", "update", "wip")
❌ **PRs trop grosses** (> 500 lignes changées)
❌ **Merge sans review**
❌ **Code non testé** localement avant push
❌ **Ignorer les conventions** de nommage

## 📚 Ressources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Git Best Practices](https://git-scm.com/book/en/v2)
- [Code Review Best Practices](https://google.github.io/eng-practices/review/)

---

Pour les standards de code et critères de review, voir [DEVELOPMENT.md](./DEVELOPMENT.md).
