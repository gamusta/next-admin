import { relations } from 'drizzle-orm';
import { companies } from './companies';
import { companyUsers } from './company-user';
import {users} from "@/lib/db/schema/users";
import {clients} from "@/lib/db/schema/clients";
import {quotes} from "@/lib/db/schema/quotes";
import {invoices} from "@/lib/db/schema/invoices";
import { lineItems } from './line-items';

export const companiesRelations = relations(companies, ({ many }) => ({
  companyUsers: many(companyUsers),
  clients: many(clients),
  quotes: many(quotes),
  invoices: many(invoices),
}));

export const usersRelations = relations(users, ({ many }) => ({
  companyUsers: many(companyUsers),
}));

export const companyUsersRelations = relations(companyUsers, ({ one }) => ({
  company: one(companies, {
    fields: [companyUsers.companyId],
    references: [companies.id],
  }),
  user: one(users, {
    fields: [companyUsers.userId],
    references: [users.id],
  }),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  company: one(companies, {
    fields: [clients.companyId],
    references: [companies.id],
  }),
  quotes: many(quotes),
  invoices: many(invoices),
}));

export const quotesRelations = relations(quotes, ({ one, many }) => ({
  company: one(companies, {
    fields: [quotes.companyId],
    references: [companies.id],
  }),
  client: one(clients, {
    fields: [quotes.clientId],
    references: [clients.id],
  }),
  lineItems: many(lineItems),
  invoices: many(invoices), // Un devis peut générer plusieurs factures
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  company: one(companies, {
    fields: [invoices.companyId],
    references: [companies.id],
  }),
  client: one(clients, {
    fields: [invoices.clientId],
    references: [clients.id],
  }),
  quote: one(quotes, {
    fields: [invoices.quoteId],
    references: [quotes.id],
  }),
  lineItems: many(lineItems),
}));

export const lineItemsRelations = relations(lineItems, ({ one }) => ({
  quote: one(quotes, {
    fields: [lineItems.quoteId],
    references: [quotes.id],
  }),
  invoice: one(invoices, {
    fields: [lineItems.invoiceId],
    references: [invoices.id],
  }),
}));
