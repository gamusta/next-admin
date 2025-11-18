import { pgTable, uuid, text, timestamp, numeric, index } from 'drizzle-orm/pg-core';
import { companies } from './companies';
import { clients } from './clients';
import { quotes } from './quotes';
import { invoiceStatusEnum } from './enums';

export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  clientId: uuid('client_id').notNull().references(() => clients.id, { onDelete: 'restrict' }),

  // Lien avec devis (optionnel)
  quoteId: uuid('quote_id').references(() => quotes.id, { onDelete: 'set null' }),

  number: text('number').notNull(), // FAC-2025-001
  issueDate: timestamp('issue_date').notNull(),
  dueDate: timestamp('due_date').notNull(), // Date d'échéance
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
  taxAmount: numeric('tax_amount', { precision: 10, scale: 2 }).notNull(),
  totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  status: invoiceStatusEnum('status').notNull().default('draft'),
  sentAt: timestamp('sent_at'),
  paidAt: timestamp('paid_at'),
  paymentMethod: text('payment_method'), // virement, chèque, carte, espèces
  paymentReference: text('payment_reference'),
  notes: text('notes'),
  termsAndConditions: text('terms_and_conditions'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  companyIdx: index('invoices_company_idx').on(table.companyId),
  clientIdx: index('invoices_client_idx').on(table.clientId),
  statusIdx: index('invoices_status_idx').on(table.status),
  numberIdx: index('invoices_number_idx').on(table.companyId, table.number),
  dueDateIdx: index('invoices_due_date_idx').on(table.dueDate),
}));
