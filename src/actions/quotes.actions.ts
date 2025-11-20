'use server';

import { db } from '@/lib/db/drizzle';
import { quotes, clients } from '@/lib/db/schema';
import { getTenantContext } from '@/lib/tenant';
import { eq } from 'drizzle-orm';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

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

  // Formater dates server-side pour performance (1x par quote vs Nx par render)
  return result.map((quote) => ({
    ...quote,
    issueDateFormatted: format(quote.issueDate, 'dd/MM/yyyy', { locale: fr }),
    expiryDateFormatted: format(quote.expiryDate, 'dd/MM/yyyy', { locale: fr }),
    // Garder dates ISO pour filtres
    issueDate: quote.issueDate.toISOString(),
    expiryDate: quote.expiryDate.toISOString(),
  }));
}
