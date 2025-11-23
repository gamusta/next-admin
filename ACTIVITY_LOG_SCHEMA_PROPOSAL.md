# Proposition : Schéma Activity Log

## 📋 Vue d'ensemble

Système d'audit trail générique pour enregistrer toutes les activités (CUD) sur les entités principales.

**Utilisation :**
- Onglet "Activité" sur les vues détaillées de factures (vente et achat)
- Traçabilité complète des modifications
- Historique des changements de statut, paiements, commentaires, etc.

---

## 🗄️ Schéma de base de données

### Table `activities`

```typescript
// src/lib/db/schema/activities.ts
import { pgTable, uuid, timestamp, text, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { companies } from './companies';
import { users } from './users';

// Enum pour les types d'entités
export const activityEntityTypeEnum = pgEnum('activity_entity_type', [
  'invoice',              // Facture de vente
  'inbound_invoice',      // Facture d'achat
  'quote',                // Devis
  'client',               // Client
  'supplier',             // Fournisseur
  // Extensible pour d'autres entités
]);

// Enum pour les types d'actions
export const activityActionTypeEnum = pgEnum('activity_action_type', [
  // Actions CRUD génériques
  'created',
  'updated',
  'deleted',

  // Actions spécifiques factures
  'status_changed',
  'sent',
  'imported',

  // Actions paiements
  'payment_added',
  'payment_updated',
  'payment_deleted',

  // Actions commentaires
  'comment_added',
  'comment_updated',
  'comment_deleted',

  // Actions documents
  'document_uploaded',
  'document_deleted',
  'pdf_generated',
  'email_sent',
]);

export const activities = pgTable('activities', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Multi-tenant
  companyId: uuid('company_id').notNull().references(() => companies.id),

  // Entité concernée (polymorphique)
  entityType: activityEntityTypeEnum('entity_type').notNull(),
  entityId: uuid('entity_id').notNull(),

  // Type d'action
  actionType: activityActionTypeEnum('action_type').notNull(),

  // Description lisible (ex: "Statut changé de 'draft' à 'sent'")
  description: text('description').notNull(),

  // Détails des changements (avant/après)
  changes: jsonb('changes'), // { before: {...}, after: {...} }

  // Métadonnées supplémentaires
  metadata: jsonb('metadata'), // Infos contextuelles (IP, user agent, etc.)

  // Qui a effectué l'action
  createdBy: uuid('created_by').notNull().references(() => users.id),

  // Quand
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Index pour performance
// CREATE INDEX idx_activities_entity ON activities(entity_type, entity_id);
// CREATE INDEX idx_activities_company ON activities(company_id);
// CREATE INDEX idx_activities_created_at ON activities(created_at DESC);
```

---

## 📊 Structure des données `changes` et `metadata`

### Format `changes` (JSONB)

```typescript
// Pour une mise à jour de champs
{
  "before": {
    "status": "draft",
    "totalAmount": "1000.00"
  },
  "after": {
    "status": "sent",
    "totalAmount": "1200.00"
  }
}

// Pour un ajout (création)
{
  "after": {
    "number": "INV-2024-001",
    "totalAmount": "1200.00",
    "status": "draft"
  }
}

// Pour une suppression
{
  "before": {
    "number": "INV-2024-001",
    "status": "draft"
  }
}

// Pour un paiement ajouté
{
  "after": {
    "paymentId": "uuid-xxx",
    "amount": "500.00",
    "paymentMethod": "transfer",
    "paymentDate": "2024-01-15"
  }
}
```

### Format `metadata` (JSONB)

```typescript
{
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "relatedEntityType": "payment",  // Pour actions sur entités liées
  "relatedEntityId": "uuid-xxx",
  "triggeredBy": "user_action" | "system" | "import" | "webhook"
}
```

---

## 🎯 Types TypeScript

```typescript
// src/types/activities.types.ts
import { activities } from '@/lib/db/schema/activities';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';

export type Activity = InferSelectModel<typeof activities>;
export type CreateActivityInput = InferInsertModel<typeof activities>;

export type ActivityEntityType =
  | 'invoice'
  | 'inbound_invoice'
  | 'quote'
  | 'client'
  | 'supplier';

export type ActivityActionType =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'status_changed'
  | 'sent'
  | 'imported'
  | 'payment_added'
  | 'payment_updated'
  | 'payment_deleted'
  | 'comment_added'
  | 'comment_updated'
  | 'comment_deleted'
  | 'document_uploaded'
  | 'document_deleted'
  | 'pdf_generated'
  | 'email_sent';

// Avec relations pour affichage
export type ActivityWithUser = Activity & {
  user: {
    id: string;
    name: string;
    email: string;
  };
};

// Helper pour les changements typés
export interface ActivityChanges<T = any> {
  before?: Partial<T>;
  after?: Partial<T>;
}

// Helper pour les métadonnées
export interface ActivityMetadata {
  ipAddress?: string;
  userAgent?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  triggeredBy?: 'user_action' | 'system' | 'import' | 'webhook';
  [key: string]: any; // Extensible
}
```

---

## 🔧 Helpers pour créer des activités

```typescript
// src/lib/activities.ts
import { db } from '@/lib/db/drizzle';
import { activities } from '@/lib/db/schema/activities';
import { getTenantContext } from '@/lib/tenant';
import type { ActivityEntityType, ActivityActionType, ActivityChanges, ActivityMetadata } from '@/types/activities.types';

interface CreateActivityOptions<T = any> {
  entityType: ActivityEntityType;
  entityId: string;
  actionType: ActivityActionType;
  description: string;
  changes?: ActivityChanges<T>;
  metadata?: ActivityMetadata;
}

export async function createActivity<T = any>(options: CreateActivityOptions<T>) {
  const { companyId, userId } = await getTenantContext();

  return await db.insert(activities).values({
    companyId,
    entityType: options.entityType,
    entityId: options.entityId,
    actionType: options.actionType,
    description: options.description,
    changes: options.changes as any,
    metadata: options.metadata as any,
    createdBy: userId,
  });
}

// Exemples d'utilisation dans les actions

// Lors de la création d'une facture
await createActivity({
  entityType: 'inbound_invoice',
  entityId: newInvoice.id,
  actionType: 'created',
  description: `Facture ${newInvoice.number} créée`,
  changes: {
    after: {
      number: newInvoice.number,
      supplierName: supplier.name,
      totalAmount: newInvoice.totalAmount,
      status: newInvoice.status,
    },
  },
});

// Lors d'un changement de statut
await createActivity({
  entityType: 'inbound_invoice',
  entityId: invoice.id,
  actionType: 'status_changed',
  description: `Statut changé de "${oldStatus}" à "${newStatus}"`,
  changes: {
    before: { status: oldStatus },
    after: { status: newStatus },
  },
});

// Lors de l'ajout d'un paiement
await createActivity({
  entityType: 'inbound_invoice',
  entityId: invoice.id,
  actionType: 'payment_added',
  description: `Paiement de ${payment.amount}€ ajouté (${paymentMethodLabels[payment.paymentMethod]})`,
  changes: {
    after: {
      paymentId: payment.id,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      paymentDate: payment.paymentDate,
    },
  },
  metadata: {
    relatedEntityType: 'payment',
    relatedEntityId: payment.id,
  },
});

// Lors de l'ajout d'un commentaire
await createActivity({
  entityType: 'inbound_invoice',
  entityId: invoice.id,
  actionType: 'comment_added',
  description: 'Commentaire ajouté',
  changes: {
    after: {
      commentId: comment.id,
      content: comment.content.substring(0, 100) + '...', // Preview
    },
  },
  metadata: {
    relatedEntityType: 'comment',
    relatedEntityId: comment.id,
  },
});
```

---

## 📱 Affichage frontend (Timeline)

```typescript
// src/components/activities/activity-timeline.tsx
'use client';

import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { ActivityWithUser } from '@/types/activities.types';

interface ActivityTimelineProps {
  activities: ActivityWithUser[];
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity.id} className="flex gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback>
              {activity.user.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{activity.user.name}</span>
              <Badge variant="outline" className="text-xs">
                {activity.actionType}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(activity.createdAt), {
                  addSuffix: true,
                  locale: fr,
                })}
              </span>
            </div>

            <p className="text-sm text-muted-foreground">
              {activity.description}
            </p>

            {/* Afficher les changements si pertinent */}
            {activity.changes && (
              <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-auto">
                {JSON.stringify(activity.changes, null, 2)}
              </pre>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## 📈 Requêtes courantes

```typescript
// src/actions/activities.actions.ts
'use server';

import { db } from '@/lib/db/drizzle';
import { activities } from '@/lib/db/schema/activities';
import { users } from '@/lib/db/schema/users';
import { getTenantContext } from '@/lib/tenant';
import { eq, and, desc } from 'drizzle-orm';
import type { ActivityEntityType } from '@/types/activities.types';

export async function getActivitiesForEntity(
  entityType: ActivityEntityType,
  entityId: string
) {
  const { companyId } = await getTenantContext();

  const result = await db
    .select({
      id: activities.id,
      entityType: activities.entityType,
      entityId: activities.entityId,
      actionType: activities.actionType,
      description: activities.description,
      changes: activities.changes,
      metadata: activities.metadata,
      createdAt: activities.createdAt,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(activities)
    .innerJoin(users, eq(activities.createdBy, users.id))
    .where(
      and(
        eq(activities.companyId, companyId),
        eq(activities.entityType, entityType),
        eq(activities.entityId, entityId)
      )
    )
    .orderBy(desc(activities.createdAt))
    .limit(100);

  return result;
}
```

---

## ✅ Avantages de cette approche

1. **Générique** : Une seule table pour toutes les entités
2. **Flexible** : JSONB permet de stocker n'importe quel changement
3. **Multi-tenant** : Filtrage par companyId
4. **Performant** : Index sur les colonnes clés
5. **Traçabilité complète** : Qui, quoi, quand, avant/après
6. **Extensible** : Facile d'ajouter de nouveaux types d'actions
7. **Type-safe** : TypeScript avec types inférés de Drizzle

## 🔄 Alternative : Table par entité

Si tu préfères plus de contrôle type-safe :

```typescript
// src/lib/db/schema/invoice-activities.ts
export const invoiceActivities = pgTable('invoice_activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  invoiceId: uuid('invoice_id').notNull().references(() => invoices.id),
  actionType: activityActionTypeEnum('action_type').notNull(),
  // ... reste identique
});

// src/lib/db/schema/inbound-invoice-activities.ts
export const inboundInvoiceActivities = pgTable('inbound_invoice_activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  inboundInvoiceId: uuid('inbound_invoice_id').notNull()
    .references(() => inboundInvoices.id),
  actionType: activityActionTypeEnum('action_type').notNull(),
  // ... reste identique
});
```

**Inconvénients :**
- Duplication de code
- Plus difficile de requêter les activités globales
- Moins flexible pour l'évolution

---

## 🎯 Recommandation

Je recommande **l'approche table unique générique** (`activities`) car :
- Plus simple à maintenir
- Extensible pour toutes les entités futures
- Requêtes cross-entity possibles (feed d'activité global)
- Moins de duplication

Le polymorphisme via `entityType` + `entityId` est un pattern éprouvé pour les activity logs.
