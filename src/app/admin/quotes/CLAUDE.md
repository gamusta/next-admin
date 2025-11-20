# Module Devis (Quotes)

> **📍 Pour Claude Code :** Tu dois d'abord lire `/CLAUDE.md` (racine) pour le contexte global, puis ce fichier pour les spécificités devis.

## 🎯 Objectif
Gestion cycle de vie devis : création → envoi → signature/refus → conversion facture

---

## 🤖 Instructions Claude Code

**Pré-requis avant de coder :**
1. Lire `/CLAUDE.md` EN PREMIER (structure, patterns, conventions globales)
2. Lire ce fichier pour spécificités métier devis

**Chemins depuis racine projet :**
- Pages : `src/app/admin/quotes/`
- Composants : `src/components/quotes/`
- Actions : `src/actions/quotes.actions.ts`
- Types : `src/types/quotes.types.ts`
- Schema DB : `src/lib/db/schema/quotes.ts` + `line-items.ts`

**Rappels critiques (vérifie TOUJOURS) :**
- ⚠️ Multi-tenant : TOUJOURS filtrer par `companyId` via `getTenantContext()`
- ⚠️ Calculs montants : TOUJOURS recalculer côté serveur (jamais confiance client)
- ⚠️ RBAC : accountant = lecture seule (pas accès drafts)
- ⚠️ Validation : Zod schemas AVANT insert/update

---

## 📊 Tables DB

**Schemas Drizzle (source de vérité) :**
- `src/lib/db/schema/quotes.ts` - Table quotes
- `src/lib/db/schema/line-items.ts` - Table line_items
- `src/lib/db/schema/enums.ts` - Status enums

**Contraintes métier critiques :**
- **quotes** : UNIQUE(companyId, number) pour numérotation
- **line_items** : XOR constraint (quoteId OU invoiceId, jamais les deux)
- **Status** : draft | to_send | pending | refused | signed
- **Montants** : subtotal, taxAmount, totalAmount calculés server-side (ne pas faire confiance client)

---

## 🔄 Workflow Statuts

```
draft → to_send → pending → signed/refused
  ↓         ↓          ↓          ↓
edit    email    relance   conversion
delete                      facture
```

**Labels FR :** Brouillon | À envoyer | En attente | Refusé | Signé

**Actions par statut :**
- `draft` : modifier, supprimer, dupliquer, valider (→ to_send)
- `to_send` : envoyer email (→ pending), supprimer, dupliquer, générer facture
- `pending` : relancer, signer/refuser manuellement, dupliquer
- `signed` : générer facture, dupliquer, supprimer
- `refused` : dupliquer, supprimer

**Transitions :**
- draft → to_send : validation formulaire
- to_send → pending : envoi email + `sentAt`
- pending → signed : signature + `signedAt`
- pending → refused : refus + `rejectedAt`

**Note :** Owner peut modifier statuts manuellement (to_send, pending, signed, refused)

---

## 🔐 Permissions (RBAC)

| Action | isAdmin | owner | accountant |
|--------|---------|-------|------------|
| Voir drafts | ✅ | ✅ | ❌ |
| Voir autres | ✅ | ✅ | ✅ (lecture seule) |
| Créer/Modifier/Supprimer | ✅ | ✅ | ❌ |
| Envoyer/Changer statuts | ✅ | ✅ | ❌ |

**Company Switcher (accountant multi-companies) :**
- Composant `<CompanySwitcher>` dans sidebar header
- Cookie `currentCompanyId` (httpOnly, secure)
- `getTenantContext()` vérifie accès via `company_users`

---

## 🔢 Numérotation Auto

**Format :** `DEV-YYYY-NNN` (ex: DEV-2025-001)
- Séquentiel par **company** et par **année**

---

## 💰 Calculs Montants

**Formules (calculées côté serveur AVANT insert) :**
```typescript
// LineItem
subtotal = quantity * unitPrice
taxAmount = subtotal * (taxRate / 100)
totalAmount = subtotal + taxAmount

// Quote (somme lineItems)
subtotal = sum(lineItems.subtotal)
taxAmount = sum(lineItems.taxAmount)
totalAmount = sum(lineItems.totalAmount)
```

⚠️ **NE JAMAIS faire confiance aux calculs client.**

---

## 📋 Validation Zod

```typescript
// types/quotes.types.ts
const LineItemSchema = z.object({
  type: z.enum(['product', 'service']),
  description: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  taxRate: z.number().min(0).max(100).default(20)
});

export const CreateQuoteSchema = z.object({
  clientId: z.string().uuid(),
  issueDate: z.date(),
  expiryDate: z.date(),
  lineItems: z.array(LineItemSchema).min(1),
  notes: z.string().optional(),
  termsAndConditions: z.string().optional()
}).refine(data => data.expiryDate > data.issueDate);

export type CreateQuoteInput = z.infer<typeof CreateQuoteSchema>;
```

**Usage Server Action :**
```typescript
export async function createQuote(rawInput: unknown) {
  const input = CreateQuoteSchema.parse(rawInput);
  const { companyId, role } = await getTenantContext();
  if (role === 'accountant') throw new Error('Forbidden');
  // ...
}
```

---

## 📁 Structure Module

```
app/admin/quotes/
├── page.tsx               # ✅ Liste + filtres
├── [id]/page.tsx         # 🚧 Détail
├── [id]/edit/page.tsx    # 🚧 Édition (si draft)
└── new/page.tsx          # 🚧 Création

components/quotes/
├── columns.tsx            # ✅ TanStack Table
├── data-table.tsx         # ✅ Table + filtres
├── quotes-toolbar.tsx     # ✅ Filtres status/dates/montants
├── quote-form.tsx         # 🚧 Formulaire création/édition
└── line-items-form.tsx    # 🚧 Gestion lignes (useFieldArray)

actions/quotes.actions.ts
├── getQuotes()            # ✅ Liste + JOIN clients
├── getQuoteById()         # 🚧
├── createQuote()          # 🚧
├── updateQuote()          # 🚧
├── deleteQuote()          # 🚧
├── sendQuote()            # 🚧 transition to_send → pending
├── signQuote()            # 🚧 transition pending → signed
└── refuseQuote()          # 🚧 transition pending → refused

types/quotes.types.ts      # ✅ Quote, QuoteWithRelations, CreateQuoteInput
types/line-items.types.ts  # ✅ LineItem, CreateLineItemInput
```

---

## 🚧 Roadmap

### Priorité 1 - CRUD
- [ ] Page détail `/quotes/[id]` (readonly + actions selon statut)
- [ ] Formulaire création `/quotes/new` (client select + lignes dynamiques)
- [ ] Formulaire édition `/quotes/[id]/edit` (uniquement si draft)
- [ ] Actions : `createQuote()`, `updateQuote()`, `deleteQuote()`

### Priorité 2 - Lignes avancées
- [ ] Composant `LineItemsForm` avec `useFieldArray`
- [ ] Calculs temps réel (affichage uniquement, pas d'envoi)
- [ ] Types product vs service (+ catalogue produits ?)

### Priorité 3 - Workflow
- [ ] Envoi email client + génération PDF
- [ ] Actions : `sendQuote()`, `signQuote()`, `refuseQuote()`
- [ ] Tracking dates automatique (sentAt, signedAt, rejectedAt)

### Priorité 4 - Features avancées
- [ ] Conversion devis → facture (copie line_items)
- [ ] Duplication devis
- [ ] Conditions générales personnalisables par company
- [ ] Aperçu PDF avant envoi
- [ ] Historique modifications (audit log)

---

## ⚠️ Pièges Spécifiques

1. **Oublier companyId** → Fuite cross-tenant
2. **Calculs côté client** → Toujours recalculer server-side
3. **Modifier quote signed** → Vérifier status avant update
4. **Conversion facture** → Copier line_items, pas déplacer
