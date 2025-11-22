import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const legalForms = pgTable('legal_forms', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: text('code').notNull().unique(), // Ex: "SARL", "SAS", "SA"
  label: text('label').notNull(), // Ex: "Société à responsabilité limitée"
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
