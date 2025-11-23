import { pgTable, uuid, numeric, timestamp, text, index } from 'drizzle-orm/pg-core';
import { inboundInvoices } from './inbound-invoices';
import { users } from './users';
import { paymentMethodEnum } from './enums';

export const inboundInvoicePayments = pgTable('inbound_invoice_payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  inboundInvoiceId: uuid('inbound_invoice_id').notNull().references(() => inboundInvoices.id, { onDelete: 'cascade' }),

  // Paiement
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(), // Montant du paiement
  paymentDate: timestamp('payment_date').notNull(), // Date du paiement
  paymentMethod: paymentMethodEnum('payment_method').notNull(),
  reference: text('reference'), // R�f�rence du paiement (n� ch�que, n� virement, etc.)

  // Notes
  notes: text('notes'),

  // Qui a enregistr� ce paiement
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  invoiceIdx: index('inbound_invoice_payments_invoice_idx').on(table.inboundInvoiceId),
  paymentDateIdx: index('inbound_invoice_payments_payment_date_idx').on(table.paymentDate),
}));
