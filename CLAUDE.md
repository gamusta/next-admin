# CLAUDE.md

Guide de contexte pour Claude Code sur ce projet.

## Objectif du projet

SaaS B2B de **gestion financière** pour TPE et indépendants.

## Stack technique

- **Next.js 16** (App Router) - Frontend + Backend unifié
- **Drizzle ORM** + **PostgreSQL** - Base de données
- **shadcn/ui** + **Tailwind CSS** - Interface
- **Jose** - Auth JWT (cookies httpOnly, 1 jour)
- **Stripe** - Paiements
- **Multi-tenant** - Isolation par `companyId`

## Structure du projet
```
src/
├── app/
│   ├── (login)/           # Routes publiques
│   ├── admin/             # Routes protégées
│   │   ├── (dashboard)/
│   │   ├── quotes/
│   │   ├── invoices/
│   │   ├── clients/
│   │   └── settings/
│   └── api/               # API Routes
│
├── components/
│   ├── ui/                # Shadcn/ui
│   ├── layout/            # Header, Sidebar
│   ├── quotes/            # Composants devis
│   └── shared/            # Réutilisables
│
├── lib/
│   ├── auth/              # JWT & session
│   ├── db/                # Drizzle schema + queries
│   ├── tenant.ts          # Multi-tenant
│   └── utils.ts
│
├── actions/               # Server Actions
│   ├── auth.actions.ts
│   ├── quotes.actions.ts
│   └── invoices.actions.ts
│
├── hooks/                 # Hooks personnalisés
│
└── types/                 # Types TypeScript
    ├── index.ts
    ├── quotes.types.ts
    └── ...
```

## Commandes

```bash
npm run dev              # Dev server
npm run db:generate      # Générer migrations
npm run db:migrate       # Appliquer migrations
npm run db:studio        # GUI Drizzle
npm run db:seed          # Seed DB
```

## Bonnes pratiques

### Server Actions
- Utiliser les wrappers de `lib/auth/middleware.ts`
- Valider avec **Zod**
- Pattern : `validatedActionWithUser(schema, async (data, user) => {...})`

### Base de données
- Centraliser les requêtes dans `lib/db/queries.ts`
- **Toujours filtrer par `teamId`** pour l'isolation multi-tenant
- Utiliser les relations Drizzle

### Composants
- **Server Components** par défaut
- `"use client"` uniquement si nécessaire (state, events, hooks)
- Utiliser `cn()` pour les classes conditionnelles

### Navigation
- Nouvelle page dans `admin/` → Ajouter lien dans `components/nav-main.tsx`

### Styling
- **Tailwind CSS** uniquement
- Variables CSS dans `app/globals.css`
- Respecter le design system shadcn/ui

## Tables principales

- **users** - Comptes (email, password, role)
- **companies** - Company (multi-tenant)
- **company_users** - Relation companies ↔ users avec role

## Variables d'environnement

```env
POSTGRES_URL=postgresql://...
BASE_URL=http://localhost:3000
```
