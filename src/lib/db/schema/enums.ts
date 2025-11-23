import { pgEnum } from 'drizzle-orm/pg-core';

export const quoteStatusEnum = pgEnum('quote_status', [
  'draft',
  'to_send',
  'pending',
  'refused',
  'signed',
]);

export const invoiceStatusEnum = pgEnum('invoice_status', [
  'draft',
  'to_send',
  'sent',
  'overdue',
  'paid',
]);

export const lineItemTypeEnum = pgEnum('line_item_type', [
  'product',
  'service',
]);

export const inboundInvoiceStatusEnum = pgEnum('inbound_invoice_status', [
  'imported',  // À vérifier
  'accepted',  // À payer
  'paid',      // Payé
  'refused',   // Refusé
]);
