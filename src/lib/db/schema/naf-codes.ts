import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const nafCodes = pgTable('naf_codes', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: text('code').notNull().unique(), // Ex: "62.01Z"
  label: text('label').notNull(), // Ex: "Programmation informatique"
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
