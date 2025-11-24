import { pgTable, uuid, text, timestamp, numeric, index, unique } from 'drizzle-orm/pg-core';
import { companies } from './companies';
import { suppliers } from './suppliers';
import { inboundInvoiceStatusEnum } from './enums';

export const inboundInvoices = pgTable('inbound_invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  supplierId: uuid('supplier_id').notNull().references(() => suppliers.id, { onDelete: 'restrict' }),

  // Numéro facture fournisseur (leur numéro, pas le nôtre)
  number: text('number').notNull(),

  // Dates
  issueDate: timestamp('issue_date').notNull(), // Date de facturation
  dueDate: timestamp('due_date').notNull(),     // Date d'échéance

  // Montants
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
  taxAmount: numeric('tax_amount', { precision: 10, scale: 2 }).notNull(),
  totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),

  // Status workflow
  status: inboundInvoiceStatusEnum('status').notNull().default('imported'),

  // Dates de workflow
  importedAt: timestamp('imported_at').defaultNow().notNull(),
  acceptedAt: timestamp('accepted_at'),
  paidAt: timestamp('paid_at'),
  refusedAt: timestamp('refused_at'),

  // Notes (notes générales sur la facture)
  notes: text('notes'),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  companyIdx: index('inbound_invoices_company_idx').on(table.companyId),
  supplierIdx: index('inbound_invoices_supplier_idx').on(table.supplierId),
  statusIdx: index('inbound_invoices_status_idx').on(table.status),
  dueDateIdx: index('inbound_invoices_due_date_idx').on(table.dueDate),
  issueDateIdx: index('inbound_invoices_issue_date_idx').on(table.issueDate),
  companyNumberUnique: unique('inbound_invoices_company_number_unique').on(table.companyId, table.number),
}));
