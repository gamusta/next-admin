import { pgTable, uuid, text, timestamp, numeric, index } from 'drizzle-orm/pg-core';
import { companies } from './companies';
import { clients } from './clients';
import { quoteStatusEnum } from './enums';

export const quotes = pgTable('quotes', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  clientId: uuid('client_id').notNull().references(() => clients.id, { onDelete: 'restrict' }),

  number: text('number').notNull(), // DEV-2025-001
  issueDate: timestamp('issue_date').notNull(),
  expiryDate: timestamp('expiry_date').notNull(), // Date d'échéance
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(), // HT
  taxAmount: numeric('tax_amount', { precision: 10, scale: 2 }).notNull(),
  totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(), // TTC
  status: quoteStatusEnum('status').notNull().default('draft'),
  sentAt: timestamp('sent_at'),
  signedAt: timestamp('signed_at'),
  rejectedAt: timestamp('rejected_at'),
  notes: text('notes'),
  termsAndConditions: text('terms_and_conditions'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  companyIdx: index('quotes_company_idx').on(table.companyId),
  clientIdx: index('quotes_client_idx').on(table.clientId),
  statusIdx: index('quotes_status_idx').on(table.status),
  numberIdx: index('quotes_number_idx').on(table.companyId, table.number),
}));
