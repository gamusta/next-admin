# Feature: Gestion Fournisseurs (Suppliers)

> **Contexte :** Module de gestion des fournisseurs pour l'application SaaS Finance.
> **Référence globale :** `/CLAUDE.md` (conventions, stack, architecture)

## 🎯 Objectif de la feature

Permettre aux utilisateurs de gérer leurs fournisseurs avec :
- **Liste** : Tableau avec recherche, filtres, pagination
- **Détail/Édition** : Formulaire multi-volets (Informations, Contacts, Notes)
- **Création** : Ajout nouveau fournisseur
- **Archivage** : Soft delete sans suppression définitive

---

## 📊 Schéma de données

### Fichiers sources (à jour)
```
/src/lib/db/schema/
├── suppliers.ts           # Table principale avec relations
├── supplier-contacts.ts   # Contacts (cascade delete)
├── naf-codes.ts          # Codes NAF (10 prédéfinis)
└── legal-forms.ts        # Formes juridiques (13 prédéfinies)

/src/types/
└── suppliers.types.ts    # Types TS + Zod schemas

/src/lib/db/
└── seed-suppliers.ts     # Seed données de référence

/docs/
└── schema-suppliers.md   # Documentation complète
```

### Points clés
- 🔒 **Multi-tenant** : `companyId` sur `suppliers`
- **Index** : `companyId`, `siret`, `businessName`
- **Contrainte** : `UNIQUE(siret, companyId)` - Même SIRET autorisé pour plusieurs companies
- **Cascade** : Suppression fournisseur → supprime ses contacts
- **Validation** : SIRET (14 chars), IBAN format FR uniquement

📖 **Lire les schémas complets dans les fichiers ci-dessus avant de coder.**

---

## 📁 Structure des fichiers

```
src/app/admin/suppliers/
└── page.tsx                    # Liste + Dialog création/édition (Server Component)

src/components/suppliers/
├── supplier-list.tsx           # Table liste (Client Component)
├── supplier-filters.tsx        # Filtres (Client Component)
├── supplier-dialog.tsx         # Dialog création/édition avec tabs (Client Component)
├── supplier-form/
│   ├── info-tab.tsx            # Volet Informations
│   ├── contacts-tab.tsx        # Volet Contacts
│   └── notes-tab.tsx           # Volet Notes
└── contact-form-dialog.tsx     # Dialog ajout contact

src/actions/
└── suppliers.actions.ts        # Server Actions

src/lib/db/
├── schema/
│   ├── suppliers.ts
│   ├── supplier-contacts.ts
│   ├── naf-codes.ts
│   └── legal-forms.ts
└── queries/
    └── suppliers.queries.ts    # Requêtes réutilisables

src/types/
└── suppliers.types.ts          # Types + Zod schemas
```

---

## 🎨 UI/UX - Spécifications

### Page Unique (`/admin/suppliers`)

**Layout :**
```
┌─────────────────────────────────────────────────┐
│ Header: "Fournisseurs" [+ Nouveau fournisseur] │ ← Ouvre dialog
├─────────────────────────────────────────────────┤
│ Filtres: [🔍 Recherche] [NAF ▾] [Forme ▾]      │
│          [☑ Afficher archivés]                  │
├─────────────────────────────────────────────────┤
│ Table:                                          │
│ │ Raison sociale │ SIRET │ Email │ Actions │   │
│ │ Supplier A     │ ...   │ ...   │ ✏️ 🗑️  │   │ ← ✏️ Ouvre dialog édition
├─────────────────────────────────────────────────┤
│ Pagination: ◀ 1 2 3 ▶                          │
└─────────────────────────────────────────────────┘
```

**Fonctionnalités :**
- **Recherche** : `businessName`, `tradeName`, `siret`
- **Filtres** : NAF, Forme juridique, Archivés
- **Tri** : Par nom, date création, date modification
- **Actions** :
  - ✏️ Éditer → Ouvre dialog en mode édition
  - 🗑️ Archiver/Désarchiver
- **Pagination** : 20 résultats par page
- **Bouton "Nouveau"** → Ouvre dialog en mode création

---

### Dialog Création/Édition

**Layout - Dialog avec onglets :**
```
┌─────────────────────────────────────────────────┐
│ ✕ [Nouveau fournisseur] ou [Éditer: Nom]      │
├─────────────────────────────────────────────────┤
│ Tabs: [Informations] [Contacts] [Notes]        │
├─────────────────────────────────────────────────┤
│ (Contenu selon onglet actif)                   │
├─────────────────────────────────────────────────┤
│              [Annuler] [Enregistrer]            │
│              [Archiver] (mode édition seulement)│
└─────────────────────────────────────────────────┘
```

**Comportements :**
- **Mode création** : Dialog s'ouvre vide avec les champs vides
- **Mode édition** : Dialog pré-rempli, tous les onglets actifs
- **Validation** : En temps réel sur les champs obligatoires
- **Fermeture** :
  - Clic sur ✕ ou Annuler → Confirmation si formulaire modifié
  - Enregistrement réussi → Ferme + rafraîchit la liste + toast success
- **Archiver** : Uniquement visible en mode édition, avec confirmation

---

#### Volet 1 : Informations

**Champs obligatoires :**
- ✅ Raison sociale

**Champs optionnels :**
- SIRET (14 chiffres) + ☑ "Fournisseur sans SIRET"
- IBAN (format FR uniquement) + [Vérifier l'IBAN]
- N° TVA
- Nom commercial
- Code NAF (select depuis `naf_codes`)
- Forme juridique (select depuis `legal_forms`)
- Email, Téléphone
- Adresse complète (4 lignes + pays)

**Validation :**
- SIRET : 14 caractères si `hasSiret = true`
- IBAN : Regex FR `^FR[0-9]{2}[0-9A-Z]{11}[0-9]{11}$`
- Email : Format email valide

---

#### Volet 2 : Contacts

**État onglet :**
- Si le supplier n'a pas encore de contact : le formulaire de contact s'affiche toujours
- Si le supplier a au moins un contact : Afficher un bouton "Ajouter contact" suivi de la liste de contact

**Layout :**
```
┌─────────────────────────────────────────────────┐
│ [+ Ajouter un contact]                          │
├─────────────────────────────────────────────────┤
│ Contact 1: Jean Dupont                          │
│ Email: jean@supplier.com | Poste: Responsable   │
│ [✏️ Éditer] [🗑️ Supprimer]                      │
├─────────────────────────────────────────────────┤
│ Contact 2: ...                                  │
└─────────────────────────────────────────────────┘
```

**Dialog Ajout/Édition Contact :**
- Prénom (facultatif)
- ✅ Nom (obligatoire)
- ✅ Email (obligatoire, format valide)
- Téléphone (facultatif)
- Poste (facultatif)

**Note :** L'ajout de contact se fait lors de la création/edition du supplier

---

#### Volet 3 : Notes

**Layout :**
```
┌─────────────────────────────────────────────────┐
│ <textarea rows={8}>                             │
│ Notes internes sur le fournisseur...            │
│ </textarea>                                     │
└─────────────────────────────────────────────────┘
```

- Texte simple (pas de markdown)
- Une seule note par fournisseur (pas d'historique)

---

## 🔧 Server Actions

**Fichier :** `src/actions/suppliers.actions.ts`

```typescript
'use server';

// Suppliers CRUD
export async function getSuppliers(filters?: SupplierFilters): Promise<SupplierWithRelations[]>
export async function getSupplierById(id: string): Promise<SupplierWithRelations | null>
export async function createSupplier(data: CreateSupplierInput): Promise<{ success: boolean; supplierId?: string; error?: string }>
export async function updateSupplier(data: UpdateSupplierInput): Promise<{ success: boolean; error?: string }>
export async function archiveSupplier(id: string): Promise<{ success: boolean; error?: string }>
export async function unarchiveSupplier(id: string): Promise<{ success: boolean; error?: string }>

// Contacts CRUD
export async function createSupplierContact(data: CreateSupplierContactInput): Promise<{ success: boolean; contactId?: string; error?: string }>
export async function updateSupplierContact(data: UpdateSupplierContactInput): Promise<{ success: boolean; error?: string }>
export async function deleteSupplierContact(id: string): Promise<{ success: boolean; error?: string }>

// Reference data
export async function getNafCodes(): Promise<NafCode[]>
export async function getLegalForms(): Promise<LegalForm[]>
```

**Règles critiques :**
1. 🔒 **TOUJOURS** filtrer par `companyId` (via `getTenantContext()`)
2. Valider avec Zod schemas (`suppliers.types.ts`)
3. Vérifier `companyId` du fournisseur lors de l'accès aux contacts
4. `updatedAt` → `new Date()` lors des updates

---

### Multi-tenant Query
```typescript
// ✅ CORRECT
const { companyId } = await getTenantContext();
const suppliers = await db.select()
  .from(suppliers)
  .where(eq(suppliers.companyId, companyId));

// ❌ DANGEREUX
const suppliers = await db.select().from(suppliers); // Retourne TOUT
```

---

## ✅ Checklist Implémentation

### Phase 1 : Backend
- [ ] Server Actions (`suppliers.actions.ts`)
- [ ] Queries réutilisables (`suppliers.queries.ts`)
- [ ] Validation multi-tenant complète

### Phase 2 : Page
- [ ] Page liste unique (`page.tsx`) avec fetch des données

### Phase 3 : Components
- [ ] `SupplierList` (table + header avec bouton "Nouveau") → `/src/components/suppliers/`
- [ ] `SupplierFilters` (recherche + filtres) → `/src/components/suppliers/`
- [ ] `SupplierDialog` (dialog création/édition avec tabs) → `/src/components/suppliers/`
- [ ] Tabs du formulaire → `/src/components/suppliers/supplier-form/`
  - [ ] `InfoTab` (formulaire informations)
  - [ ] `ContactsTab` (liste contacts + bouton ajout, désactivé en création)
  - [ ] `NotesTab` (textarea notes)
- [ ] `ContactFormDialog` (dialog ajout/édition contact) → `/src/components/suppliers/`

### Phase 4 : UX
- [ ] Gestion état dialog (ouverture/fermeture)
- [ ] Désactivation onglet Contacts en mode création
- [ ] Loading states (isPending sur boutons)
- [ ] Error handling (validation + server errors)
- [ ] Toast notifications (success/error)
- [ ] Confirmation dialogs (archivage, suppression contact, fermeture avec modifications)
- [ ] Rafraîchissement liste après modification

---

## 🚨 Points d'attention

### Sécurité Multi-tenant
```typescript
// ⚠️ Lors de l'édition d'un contact, vérifier que le supplier appartient à la company
const supplier = await db.select().from(suppliers)
  .where(and(
    eq(suppliers.id, contact.supplierId),
    eq(suppliers.companyId, companyId)
  ))
  .limit(1);

if (!supplier) {
  throw new Error('Unauthorized');
}
```

### Performance
- Index sur `companyId`, `siret`, `businessName`
- Pagination côté serveur (LIMIT/OFFSET)
- Eager loading des relations (nafCode, legalForm, contacts)

### UX
- Désactiver SIRET si "sans SIRET" coché
- Validation IBAN uniquement si rempli
- Confirmation avant archivage
- Toast sur toutes les actions (success/error)

---

## 📚 Références

**Schémas & Types (sources de vérité) :**
- `/src/lib/db/schema/suppliers.ts` - Table principale
- `/src/lib/db/schema/supplier-contacts.ts` - Contacts
- `/src/lib/db/schema/naf-codes.ts` - Codes NAF
- `/src/lib/db/schema/legal-forms.ts` - Formes juridiques
- `/src/types/suppliers.types.ts` - Types TS + Zod schemas
- `/docs/schema-suppliers.md` - Documentation détaillée

**Conventions globales :**
- `/CLAUDE.md` - Stack, architecture, patterns

**Libs externes :**
- Shadcn/ui : https://ui.shadcn.com/docs/components
- Drizzle : https://orm.drizzle.team/docs/rqb

---

## 🎯 Principes clés (rappel)

1. **Multi-tenant first** : Toujours filtrer par `companyId`
2. **Server Components** : Par défaut, `'use client'` seulement si hooks/events
3. **Validation Zod** : Côté serveur ET client
4. **Types stricts** : TypeScript strict mode
5. **UX simple** : Max 3 clics pour toute action
6. **Mobile-friendly** : Responsive (Tailwind)

---

**Note pour Claude Code :**
Ce fichier contient TOUTES les spécifications nécessaires pour implémenter la feature Suppliers. Référence `CLAUDE.md` à la racine du projet pour les conventions globales du projet.
