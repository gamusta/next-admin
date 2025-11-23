## 📝 Summary
<!-- Décrivez brièvement l'objectif de cette PR en 1-2 phrases -->

## 🔄 Type of Change
<!-- Cochez la case appropriée avec un [x] -->

- [ ] 🐛 Bug fix (correction non-breaking)
- [ ] ✨ New feature (nouvelle fonctionnalité non-breaking)
- [ ] 💥 Breaking change (changement qui casse la compatibilité)
- [ ] 📚 Documentation update
- [ ] ♻️ Code refactoring (sans changement fonctionnel)
- [ ] 🎨 Style/UI update
- [ ] ⚡ Performance improvement
- [ ] ✅ Test update

## 📋 Changes
<!-- Listez les changements principaux -->

-
-
-

## 🧪 Test Plan
<!-- Comment avez-vous testé vos changements ? -->

### Testé manuellement

- [ ] Créé/modifié des données
- [ ] Testé sur différents navigateurs (Chrome, Firefox, Safari)
- [ ] Testé responsive (mobile + desktop)
- [ ] Testé les cas d'erreur

### Commandes exécutées

- [ ] `npm run build` ✅ Pas d'erreurs
- [ ] `npm run lint` ✅ Pas de warnings
- [ ] `tsc --noEmit` ✅ Types OK

### Scénarios testés
<!-- Décrivez les scénarios de test -->

1.
2.
3.

## 🛡️ Security Checklist (Multi-tenant)
<!-- CRITIQUE : Vérifiez ces points pour toutes PR -->

- [ ] Toutes les requêtes DB filtrent par `companyId`
- [ ] `getTenantContext()` appelé dans toutes les Server Actions
- [ ] Validation des inputs avec Zod
- [ ] Pas d'injection SQL/XSS possible
- [ ] Vérification des permissions utilisateur (si applicable)

## 📸 Screenshots (si UI)
<!-- Ajoutez des screenshots pour les changements visuels -->

### Avant
<!-- Screenshot ou description de l'état avant -->

### Après
<!-- Screenshot ou description de l'état après -->

## 📚 Documentation

- [ ] CLAUDE.md mis à jour (si architecture/conventions changent)
- [ ] README.md mis à jour (si installation/setup change)
- [ ] Commentaires ajoutés pour logique complexe
- [ ] Types TypeScript documentés (JSDoc si nécessaire)

## 🔗 Related Issues
<!-- Référencez les issues GitHub liées -->

Fixes #
Related to #

## ✅ Reviewer Checklist
<!-- Pour le reviewer -->

### Code Quality

- [ ] Code respecte les conventions (DEVELOPMENT.md)
- [ ] Naming clair et cohérent
- [ ] Pas de code dupliqué
- [ ] Types TypeScript stricts
- [ ] Imports organisés

### Architecture

- [ ] Server Components utilisés par défaut
- [ ] `'use client'` uniquement si nécessaire
- [ ] Server Actions pour mutations
- [ ] Structure de dossiers respectée

### Performance & UX

- [ ] Pas de performance dégradée
- [ ] Loading states présents
- [ ] Error handling correct
- [ ] Messages clairs pour l'utilisateur

## 💬 Notes additionnelles
<!-- Informations supplémentaires pour les reviewers -->

---

**Merge strategy:** Squash and merge
