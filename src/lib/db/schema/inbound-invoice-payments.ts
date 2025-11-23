import { pgTable, uuid, numeric, timestamp, text, index, foreignKey } from 'drizzle-orm/pg-core';
import { inboundInvoices } from './inbound-invoices';
import { users } from './users';
import { paymentMethodEnum } from './enums';

export const inboundInvoicePayments = pgTable('inbound_invoice_payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  inboundInvoiceId: uuid('inbound_invoice_id').notNull(),

  // Paiement
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(), // Montant du paiement
  paymentDate: timestamp('payment_date').notNull(), // Date du paiement
  paymentMethod: paymentMethodEnum('payment_method').notNull(),
  reference: text('reference'), // Référence du paiement (n° chèque, n° virement, etc.)

  // Notes
  notes: text('notes'),

  // Qui a enregistré ce paiement
  createdBy: uuid('created_by'),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Foreign keys avec noms courts
  invoiceFk: foreignKey({
    name: 'inv_pay_invoice_fk',
    columns: [table.inboundInvoiceId],
    foreignColumns: [inboundInvoices.id],
  }).onDelete('cascade').onUpdate('cascade'),

  userFk: foreignKey({
    name: 'inv_pay_user_fk',
    columns: [table.createdBy],
    foreignColumns: [users.id],
  }).onDelete('set null').onUpdate('cascade'),

  // Indexes
  invoiceIdx: index('inv_pay_invoice_idx').on(table.inboundInvoiceId),
  paymentDateIdx: index('inv_pay_payment_date_idx').on(table.paymentDate),
}));
