import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { companies } from './companies';
import { suppliers } from './suppliers';

export const supplierContacts = pgTable('supplier_contacts', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  supplierId: uuid('supplier_id').notNull().references(() => suppliers.id, { onDelete: 'cascade' }),

  // Informations contact
  firstName: text('first_name'),
  lastName: text('last_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  position: text('position'), // Poste

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Index pour performance
  companyIdIdx: index('supplier_contacts_company_id_idx').on(table.companyId),
  supplierIdIdx: index('supplier_contacts_supplier_id_idx').on(table.supplierId),
}));

export const supplierContactsRelations = relations(supplierContacts, ({ one }) => ({
  company: one(companies, {
    fields: [supplierContacts.companyId],
    references: [companies.id],
  }),
  supplier: one(suppliers, {
    fields: [supplierContacts.supplierId],
    references: [suppliers.id],
  }),
}));
