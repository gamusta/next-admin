import { relations } from 'drizzle-orm';
import { companies } from './companies';
import { companyUsers } from './company-user';
import {users} from "@/lib/db/schema/users";

export const companiesRelations = relations(companies, ({ many }) => ({
  companyUsers: many(companyUsers),
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
