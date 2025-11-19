'use server';

import { db } from '@/lib/db/drizzle';
import { quotes, clients } from '@/lib/db/schema';
import { getTenantContext } from '@/lib/tenant';
import { eq } from 'drizzle-orm';

export async function getQuotes() {
  const { companyId } = await getTenantContext();

  const result = await db
    .select({
      id: quotes.id,
      number: quotes.number,
      issueDate: quotes.issueDate,
      expiryDate: quotes.expiryDate,
      subtotal: quotes.subtotal,
      totalAmount: quotes.totalAmount,
      status: quotes.status,
      clientName: clients.name,
      clientId: clients.id,
    })
    .from(quotes)
    .innerJoin(clients, eq(quotes.clientId, clients.id))
    .where(eq(quotes.companyId, companyId))
    .orderBy(quotes.createdAt);

  return result;
}
