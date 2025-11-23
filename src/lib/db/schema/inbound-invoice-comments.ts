import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';
import { inboundInvoices } from './inbound-invoices';
import { users } from './users';

export const inboundInvoiceComments = pgTable('inbound_invoice_comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  inboundInvoiceId: uuid('inbound_invoice_id').notNull().references(() => inboundInvoices.id, { onDelete: 'cascade' }),

  // Commentaire
  content: text('content').notNull(),

  // Auteur
  createdBy: uuid('created_by').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  invoiceIdx: index('inbound_invoice_comments_invoice_idx').on(table.inboundInvoiceId),
  createdAtIdx: index('inbound_invoice_comments_created_at_idx').on(table.createdAt),
}));
