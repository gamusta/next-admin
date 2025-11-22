import { boolean, index, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { companies } from './companies';
import { nafCodes } from './naf-codes';
import { legalForms } from './legal-forms';
import { supplierContacts } from './supplier-contacts';

export const suppliers = pgTable('suppliers', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyId: uuid('company_id').notNull().references(() => companies.id),

  // Informations principales
  businessName: text('business_name').notNull(), // Raison sociale
  siret: text('siret'), // 14 caractères
  hasSiret: boolean('has_siret').notNull().default(true), // Checkbox inversée
  iban: text('iban'),
  vatNumber: text('vat_number'), // N° de TVA
  tradeName: text('trade_name'), // Nom commercial
  nafCodeId: uuid('naf_code_id').references(() => nafCodes.id),
  legalFormId: uuid('legal_form_id').references(() => legalForms.id),

  // Contact
  email: text('email'),
  phone: text('phone'),

  // Adresse
  address: text('address'),
  addressComplement: text('address_complement'),
  postalCode: text('postal_code'),
  city: text('city'),
  country: text('country').notNull().default('France'),

  // Notes
  notes: text('notes'),

  // Archivage
  isArchived: boolean('is_archived').notNull().default(false),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Index pour performance
  companyIdIdx: index('suppliers_company_id_idx').on(table.companyId),
  siretIdx: index('suppliers_siret_idx').on(table.siret),
  businessNameIdx: index('suppliers_business_name_idx').on(table.businessName),

  // Contrainte unique : même SIRET possible pour plusieurs companies
  siretCompanyUnique: unique('suppliers_siret_company_unique').on(table.siret, table.companyId),
}));

export const suppliersRelations = relations(suppliers, ({ one, many }) => ({
  company: one(companies, {
    fields: [suppliers.companyId],
    references: [companies.id],
  }),
  nafCode: one(nafCodes, {
    fields: [suppliers.nafCodeId],
    references: [nafCodes.id],
  }),
  legalForm: one(legalForms, {
    fields: [suppliers.legalFormId],
    references: [legalForms.id],
  }),
  contacts: many(supplierContacts),
}));
