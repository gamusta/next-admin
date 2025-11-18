import { pgTable, uuid, text, numeric, integer, index } from 'drizzle-orm/pg-core';
import { quotes } from './quotes';
import { invoices } from './invoices';
import { lineItemTypeEnum } from './enums';

export const lineItems = pgTable('line_items', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Référence au document (quote OU invoice)
  quoteId: uuid('quote_id').references(() => quotes.id, { onDelete: 'cascade' }),
  invoiceId: uuid('invoice_id').references(() => invoices.id, { onDelete: 'cascade' }),

  type: lineItemTypeEnum('type').notNull().default('service'),
  description: text('description').notNull(),
  quantity: numeric('quantity', { precision: 10, scale: 2 }).notNull().default('1'),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  taxRate: numeric('tax_rate', { precision: 5, scale: 2 }).notNull().default('20'), // TVA 20%
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(), // quantity * unitPrice
  taxAmount: numeric('tax_amount', { precision: 10, scale: 2 }).notNull(),
  totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  position: integer('position').notNull().default(0),

}, (table) => ({
  quoteIdx: index('line_items_quote_idx').on(table.quoteId),
  invoiceIdx: index('line_items_invoice_idx').on(table.invoiceId),
}));
