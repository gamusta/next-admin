# SaaS Finance - Gestion Financière TPE/PME

## 🎯 Vision du projet

Plateforme SaaS B2B de gestion financière et administrative pour TPE, indépendants et PME (jusqu'à 50 employés).

**Fonctionnalités principales :**
- Gestion Ventes : Factures, Devis, Clients, Produits/Services
- Gestion Achat: Facture, Fournisseurs
- Suivi de trésorerie
- Import bancaire et réconciliation
- Exports comptables
- Multi-tenant avec gestion des rôles

## 🛠️ Stack technique

### Frontend & Backend (unifié)
- **Framework** : Next.js 16 (App Router)
- **Langage** : TypeScript strict
- **UI** : Shadcn/ui + Tailwind CSS + @tabler/icons-react
- **Charts** : Recharts

### Base de données & Backend
- **Database** : PostgreSQL 15+
- **ORM** : Drizzle
- **Auth** : JWT (cookie httpOnly)
- **Multi-tenant** : Isolation logique par `companyId`

## 📁 Structure du projet
```
src/
├── app/
│   ├── (login)/           # Routes publiques (sign-in)
│   ├── admin/             # Routes protégées
│   │   ├── (dashboard)/   # Dashboard principal
│   │   ├── quotes/        # Gestion devis
│   │   ├── invoices/      # Gestion factures
│   │   ├── clients/       # Gestion clients
│   │   └── settings/      # Paramètres
│   └── api/               # API Routes Next.js
│
├── components/
│   ├── ui/                # Shadcn/ui (auto-générés)
│   ├── layout/            # Header, Sidebar, Footer
│   ├── quotes/            # Composants spécifiques devis
│   ├── invoices/          # Composants spécifiques factures
│   └── shared/            # Composants réutilisables
│
├── lib/
│   ├── auth/
│   │   └── session.ts     # getCurrentUser(), JWT helpers
│   ├── db/
│   │   ├── schema/        # Schémas Drizzle (tables)
│   │   ├── queries.ts     # Requêtes réutilisables
│   │   ├── drizzle.ts     # Client Drizzle
│   │   └── seed.ts        # Seeds test
│   ├── tenant.ts          # getTenantContext() multi-tenant
│   ├── permissions.ts     # RBAC (roles)
│   └── utils.ts           # Helpers (cn(), formatCurrency()...)
│
├── actions/               # Server Actions
│   ├── auth.actions.ts
│   ├── quotes.actions.ts
│   ├── invoices.actions.ts
│   └── clients.actions.ts
│
├── hooks/                 # Hooks React personnalisés
│   ├── use-mobile.ts
│   ├── use-user.ts
│   └── use-debounce.ts
│
└── types/                 # Types TypeScript
    ├── index.ts           # Export centralisé
    ├── quotes.types.ts
    ├── invoices.types.ts
    ├── clients.types.ts
    ├── line-items.types.ts
    └── common.types.ts
```

### Protection des routes
- **Fichier** : `proxy.ts` (Next.js 16)
- Vérifier JWT sur toutes les routes `/admin/*`
- Rediriger vers `/sign-in` si non authentifié

## 📐 Conventions de code

### Naming
- **Fichiers** : kebab-case (`quote-form.tsx`)
- **Composants** : PascalCase (`QuoteForm`)
- **Fonctions/variables** : camelCase (`createQuote`)
- **Types** : PascalCase (`CreateQuoteInput`)
- **Constantes** : UPPER_SNAKE_CASE (`JWT_SECRET`)

### Patterns

**Server Actions**
```typescript
'use server';
export async function createQuote(data: CreateQuoteInput) {
  const { companyId } = await getTenantContext();
  // TOUJOURS filtrer par companyId
}
```

**Server Components**
```typescript
// Par défaut, tous les composants sont Server Components
export default async function QuotesPage() {
  const quotes = await getQuotes(); // Fetch direct
  return (<QuoteList quotes={quotes} />);
}
```

**Client Components** (avec `'use client'`)
```typescript
'use client';
export function QuoteForm() {
  const [state, setState] = useState();
  // Interactivité, hooks, events
}
```

**Multi-tenant CRITIQUE**
```typescript
// ✅ TOUJOURS filtrer par companyId
await db.select().from(quotes)
  .where(eq(quotes.companyId, companyId));

// ❌ DANGEREUX - fuite de données
await db.select().from(quotes); // Retourne TOUTES les companies
```

### Imports
- Alias : `@/` pointe vers `src/`
- Exemple : `import { Quote } from '@/types'`

## 🔧 Variables d'environnement
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Auth
JWT_SECRET=minimum-32-caracteres-aleatoires

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 📋 Priorités développement

### ✅ Terminé
- Architecture projet
- Auth JWT + multi-tenant
- Schéma DB complet

### 🚧 En cours
- Page liste devis avec filtres
- Formulaire création devis

### 📝 À faire
- Génération PDF devis/factures
- Envoi email
- Dashboard avec stats
- Import bancaire
- Réconciliation transactions
- Exports comptables

## 🎯 Principes clés

1. **Multi-tenant first** : TOUJOURS filtrer par `companyId`
2. **Server Components par défaut** : `'use client'` seulement si nécessaire
3. **Server Actions** : Logique métier côté serveur
4. **Types stricts** : TypeScript strict mode
5. **Sécurité** : JWT, bcrypt, validation Zod
6. **UX simple** : Maximum 3 clics pour toute action
7. **Mobile-friendly** : Responsive mais desktop-first

## 📚 Documentation

- Next.js : https://nextjs.org/docs
- Drizzle : https://orm.drizzle.team/docs
- Shadcn/ui : https://ui.shadcn.com/docs
- Zod : https://zod.dev
