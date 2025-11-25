import { pgTable, uuid, text, timestamp, numeric, index, unique, jsonb } from 'drizzle-orm/pg-core';
import { companies } from './companies';
import { suppliers } from './suppliers';
import { inboundInvoiceStatusEnum } from './enums';

export const inboundInvoices = pgTable('inbound_invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  supplierId: uuid('supplier_id').references(() => suppliers.id, { onDelete: 'restrict' }),

  // Numéro facture fournisseur (leur numéro, pas le nôtre)
  number: text('number').notNull(),

  // Dates
  issueDate: timestamp('issue_date'), // Date de facturation
  dueDate: timestamp('due_date'),     // Date d'échéance

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

  // Fichier uploadé (Supabase Storage URL)
  fileUrl: text('file_url'),

  // Données OCR brutes (JSON)
  ocrData: jsonb('ocr_data'),

  // Nom fournisseur extrait (pour affichage avant association supplier)
  supplierNameExtracted: text('supplier_name_extracted'),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Contrainte unique : un fournisseur ne peut pas avoir 2 factures avec le même numéro
  uniqueInvoiceNumber: unique('inbound_inv_number_uniq')
    .on(table.companyId, table.supplierId, table.number),

  // Index composites pour requêtes fréquentes (toujours filtré par companyId)
  companyStatusIdx: index('inbound_inv_company_status_idx')
    .on(table.companyId, table.status),
  companyDueDateIdx: index('inbound_inv_company_due_date_idx')
    .on(table.companyId, table.dueDate),
  companyIssueDateIdx: index('inbound_inv_company_issue_date_idx')
    .on(table.companyId, table.issueDate),

  // Index solo pour requêtes par fournisseur
  supplierIdx: index('inbound_inv_supplier_idx').on(table.supplierId),
}));
