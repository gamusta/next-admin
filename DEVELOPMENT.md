# Guide de développement

Standards de code, bonnes pratiques et code review pour SaaS Finance.

## 📐 Standards de code

### Architecture Next.js 16

#### Server Components (par défaut)

```typescript
// ✅ Bon : Server Component
export default async function QuotesPage() {
  const quotes = await getQuotes(); // Fetch direct
  return <QuoteList quotes={quotes} />;
}
```

#### Client Components (uniquement si nécessaire)

```typescript
// ✅ Bon : Client Component pour interactivité
'use client';

export function QuoteForm() {
  const [isOpen, setIsOpen] = useState(false);
  return <Dialog open={isOpen} onOpenChange={setIsOpen}>...</Dialog>;
}

// ❌ Mauvais : Client inutile
'use client';

export function QuoteTitle({ title }: { title: string }) {
  return <h1>{title}</h1>; // Pas d'état, pas d'events → Server Component
}
```

#### Server Actions

```typescript
// ✅ Bon : Server Action sécurisée
'use server';

export async function createQuote(data: CreateQuoteInput) {
  const { companyId, userId } = await getTenantContext();

  // Validation
  const validated = createQuoteSchema.parse(data);

  // Multi-tenant : TOUJOURS filtrer par companyId
  const quote = await db.insert(quotes).values({
    ...validated,
    companyId,
    createdBy: userId,
  }).returning();

  revalidatePath('/admin/quotes');
  return quote;
}

// ❌ Dangereux : Pas de vérification tenant
'use server';

export async function createQuote(data: CreateQuoteInput) {
  // FUITE DE DONNÉES : pas de companyId !
  const quote = await db.insert(quotes).values(data).returning();
  return quote;
}
```

### 🛡️ Sécurité Multi-tenant (CRITIQUE)

#### ✅ Règles absolues

**1. TOUJOURS filtrer par `companyId` dans les requêtes**

```typescript
// ✅ Correct
const quotes = await db.select()
  .from(quotes)
  .where(eq(quotes.companyId, companyId));

// ❌ DANGEREUX - Retourne TOUTES les companies
const quotes = await db.select().from(quotes);
```

**2. TOUJOURS valider le tenant context**

```typescript
// ✅ Correct
const { companyId, userId } = await getTenantContext();
if (!companyId) throw new Error('Unauthorized');

// ❌ Dangereux
const companyId = cookies().get('companyId')?.value; // Manipulable par l'utilisateur
```

**3. TOUJOURS vérifier l'appartenance pour les updates/deletes**

```typescript
// ✅ Correct
async function deleteQuote(quoteId: number) {
  const { companyId } = await getTenantContext();

  // Vérifie que le quote appartient bien à la company
  const quote = await db.select()
    .from(quotes)
    .where(and(
      eq(quotes.id, quoteId),
      eq(quotes.companyId, companyId)
    ))
    .limit(1);

  if (!quote.length) throw new Error('Not found');

  await db.delete(quotes).where(eq(quotes.id, quoteId));
}

// ❌ DANGEREUX - Peut supprimer le quote d'une autre company
async function deleteQuote(quoteId: number) {
  await db.delete(quotes).where(eq(quotes.id, quoteId));
}
```

### 📝 Naming conventions

#### Fichiers et dossiers

```
✅ kebab-case
- quote-form.tsx
- invoice-list.tsx
- use-debounce.ts

❌ Éviter
- QuoteForm.tsx (PascalCase pour fichiers)
- invoice_list.tsx (snake_case)
```

#### Code

```typescript
// ✅ Composants : PascalCase
export function QuoteForm() {}
export function InvoiceDialog() {}

// ✅ Fonctions/variables : camelCase
const createQuote = async () => {};
const isValidQuote = true;

// ✅ Types : PascalCase
type CreateQuoteInput = { ... };
interface QuoteFormProps { ... }

// ✅ Constantes : UPPER_SNAKE_CASE
const JWT_SECRET = process.env.JWT_SECRET;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// ✅ Enums : PascalCase pour le nom, UPPER_CASE pour les valeurs
enum QuoteStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  ACCEPTED = 'ACCEPTED',
}
```

### 🎨 Conventions TypeScript

#### Types stricts

```typescript
// ✅ Bon : Types explicites
type CreateQuoteInput = {
  clientId: number;
  items: QuoteLineItem[];
  validUntil: Date;
};

// ❌ Éviter : any
function createQuote(data: any) {} // Perte de type safety

// ✅ Bon : unknown si type inconnu
function handleApiResponse(data: unknown) {
  // Validation avec Zod ou type guards
}
```

#### Imports organisés

```typescript
// ✅ Bon : Groupés et triés
// 1. External libs
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 2. Internal libs/utils
import { cn, formatCurrency } from '@/lib/utils';
import { getTenantContext } from '@/lib/tenant';

// 3. Components
import { Button } from '@/components/ui/button';
import { QuoteForm } from '@/components/quotes/quote-form';

// 4. Types
import type { Quote, CreateQuoteInput } from '@/types';

// 5. Styles (si nécessaire)
import styles from './component.module.css';
```

### ♻️ Réutilisabilité

#### Composants

```typescript
// ✅ Bon : Composant réutilisable
type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
};

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1>{title}</h1>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>
      {actions}
    </div>
  );
}

// ❌ Éviter : Trop spécifique
export function QuotesPageHeaderWithCreateButton() {
  return (
    <div>
      <h1>Devis</h1>
      <Button>Créer un devis</Button>
    </div>
  );
}
```

## ✅ Checklist Code Review

### 🔍 Avant de soumettre la PR

**Développeur (vous)**

- [ ] Code testé localement
- [ ] `npm run build` passe sans erreurs
- [ ] `npm run lint` passe sans warnings
- [ ] Types TypeScript corrects (`tsc --noEmit`)
- [ ] Pas de `console.log` oubliés
- [ ] Pas de TODOs non résolus critiques
- [ ] Commit messages respectent Conventional Commits
- [ ] PR description complète (Summary, Changes, Test Plan)

### 🧐 Pendant la review (Reviewer)

#### 1. Sécurité (PRIORITAIRE)

- [ ] **Multi-tenant** : Tous les queries filtrent par `companyId`
- [ ] **Auth** : Vérification JWT/session sur routes protégées
- [ ] **Validation** : Inputs validés avec Zod
- [ ] **Injections** : Pas de SQL injection, XSS, command injection
- [ ] **Permissions** : Vérification des droits utilisateur (RBAC)

#### 2. Architecture

- [ ] Server Components utilisés par défaut
- [ ] `'use client'` uniquement si nécessaire (state, events, hooks)
- [ ] Server Actions pour mutations
- [ ] Pas de logique métier côté client
- [ ] Structure de dossiers respectée

#### 3. Code Quality

- [ ] Naming conventions respectées
- [ ] Types TypeScript stricts (pas de `any`)
- [ ] Imports organisés et triés
- [ ] Pas de code dupliqué (DRY)
- [ ] Fonctions courtes et focalisées (< 50 lignes)
- [ ] Commentaires seulement si nécessaire

#### 4. Performance

- [ ] Pas de fetch dans des loops
- [ ] Images optimisées (Next Image)
- [ ] Composants memoïsés si re-renders fréquents
- [ ] Pagination pour listes longues

#### 5. UX/UI

- [ ] Responsive (mobile + desktop)
- [ ] Loading states (Suspense, skeletons)
- [ ] Error handling (try/catch, error boundaries)
- [ ] Messages d'erreur clairs
- [ ] Confirmation pour actions destructives

#### 6. Tests (si applicable)

- [ ] Tests unitaires pour logique complexe
- [ ] Tests d'intégration pour Server Actions
- [ ] Edge cases couverts

### 📊 Niveaux de sévérité

**🔴 Bloquant (must fix)**

- Faille de sécurité multi-tenant
- Injection SQL/XSS
- Build fail
- Régression fonctionnelle

**🟡 Important (should fix)**

- Performance dégradée
- Mauvaise UX
- Code dupliqué important
- Types `any` utilisés

**🔵 Suggestion (nice to have)**

- Naming améliorable
- Refactoring possible
- Documentation manquante

## 🎯 Critères de merge

### Obligatoires

✅ Review approuvée par au moins 1 personne
✅ Tous les commentaires 🔴 Bloquants résolus
✅ Build passe (`npm run build`)
✅ Lint passe (`npm run lint`)
✅ Types corrects (`tsc --noEmit`)
✅ Pas de conflit avec `main`

### Recommandés

🟡 Commentaires 🟡 Important résolus
🟡 Tests ajoutés pour nouvelles features
🟡 Documentation mise à jour si nécessaire

## 🚀 Best Practices

### 1. Multi-tenant first

```typescript
// Toujours commencer par :
const { companyId, userId } = await getTenantContext();
```

### 2. Validation systématique

```typescript
import { z } from 'zod';

const createQuoteSchema = z.object({
  clientId: z.number().positive(),
  items: z.array(quoteLineItemSchema).min(1),
});

// Dans Server Action
const validated = createQuoteSchema.parse(data);
```

### 3. Error handling

```typescript
// ✅ Bon
try {
  const quote = await createQuote(data);
  return { success: true, data: quote };
} catch (error) {
  console.error('Failed to create quote:', error);
  return { success: false, error: 'Échec de création du devis' };
}

// ❌ Éviter : Erreurs silencieuses
const quote = await createQuote(data).catch(() => null);
```

### 4. Composants focalisés

```typescript
// ✅ Bon : Une responsabilité
function QuoteListItem({ quote }: { quote: Quote }) {
  return <div>{quote.number}</div>;
}

// ❌ Éviter : Trop de responsabilités
function QuoteListItemWithActionsAndDialogAndForm() {
  // 500 lignes de code...
}
```

## 📚 Ressources

- [Next.js App Router](https://nextjs.org/docs/app)
- [Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Drizzle ORM](https://orm.drizzle.team/docs/overview)
- [Zod Validation](https://zod.dev/)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)

---

Pour le workflow Git et collaboration, voir [CONTRIBUTING.md](./CONTRIBUTING.md).
