import {pgTable, uuid, timestamp, index, pgEnum, boolean, unique} from 'drizzle-orm/pg-core';
import { companies } from './companies';
import { users } from './users';

export const companyRoleEnum = pgEnum('company_role', [
  'owner',
  'admin',
  'accountant',
  'employee',
]);

export const companyUsers = pgTable('company_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: companyRoleEnum('role').notNull().default('employee'),
  isActive: boolean('is_active').default(true).notNull(),
  invitedBy: uuid('invited_by').references(() => users.id),
  invitedAt: timestamp('invited_at').defaultNow(),
  joinedAt: timestamp('joined_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  // Contrainte unique : un user ne peut avoir qu'un seul rôle par company
  companyUserUnique: unique().on(table.companyId, table.userId),
  // Index pour performance
  companyIdx: index('company_users_company_idx').on(table.companyId),
  userIdx: index('company_users_user_idx').on(table.userId),
}));
