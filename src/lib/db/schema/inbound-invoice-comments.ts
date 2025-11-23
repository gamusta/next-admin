import { pgTable, uuid, text, timestamp, index, foreignKey } from 'drizzle-orm/pg-core';
import { inboundInvoices } from './inbound-invoices';
import { users } from './users';

export const inboundInvoiceComments = pgTable('inbound_invoice_comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  inboundInvoiceId: uuid('inbound_invoice_id').notNull(),

  // Commentaire
  content: text('content').notNull(),

  // Auteur
  createdBy: uuid('created_by').notNull(),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Foreign keys avec noms courts
  invoiceFk: foreignKey({
    name: 'inv_comm_invoice_fk',
    columns: [table.inboundInvoiceId],
    foreignColumns: [inboundInvoices.id],
  }).onDelete('cascade').onUpdate('cascade'),

  userFk: foreignKey({
    name: 'inv_comm_user_fk',
    columns: [table.createdBy],
    foreignColumns: [users.id],
  }).onDelete('cascade').onUpdate('cascade'),

  // Indexes
  invoiceIdx: index('inv_comm_invoice_idx').on(table.inboundInvoiceId),
  createdAtIdx: index('inv_comm_created_at_idx').on(table.createdAt),
}));
