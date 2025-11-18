import { pgTable, uuid, text, timestamp, boolean, index } from 'drizzle-orm/pg-core';
import { companies } from './companies';

export const clients = pgTable('clients', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),

  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  city: text('city'),
  postalCode: text('postal_code'),
  country: text('country').default('FR'),

  siret: text('siret'),
  vatNumber: text('vat_number'),

  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  companyIdx: index('clients_company_idx').on(table.companyId),
}));
