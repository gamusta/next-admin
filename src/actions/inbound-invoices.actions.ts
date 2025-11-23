'use server';

import { db } from '@/lib/db/drizzle';
import { inboundInvoices, suppliers } from '@/lib/db/schema';
import { getTenantContext } from '@/lib/tenant';
import { eq } from 'drizzle-orm';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export async function getInboundInvoices() {
  const { companyId } = await getTenantContext();

  const result = await db
    .select({
      id: inboundInvoices.id,
      number: inboundInvoices.number,
      issueDate: inboundInvoices.issueDate,
      dueDate: inboundInvoices.dueDate,
      subtotal: inboundInvoices.subtotal,
      taxAmount: inboundInvoices.taxAmount,
      totalAmount: inboundInvoices.totalAmount,
      status: inboundInvoices.status,
      supplierName: suppliers.businessName,
      supplierId: suppliers.id,
    })
    .from(inboundInvoices)
    .innerJoin(suppliers, eq(inboundInvoices.supplierId, suppliers.id))
    .where(eq(inboundInvoices.companyId, companyId))
    .orderBy(inboundInvoices.createdAt);

  // Formater dates server-side pour performance (1x par invoice vs Nx par render)
  return result.map((invoice) => ({
    ...invoice,
    issueDateFormatted: format(invoice.issueDate, 'dd/MM/yyyy', { locale: fr }),
    dueDateFormatted: format(invoice.dueDate, 'dd/MM/yyyy', { locale: fr }),
    // Garder dates ISO pour filtres
    issueDate: invoice.issueDate.toISOString(),
    dueDate: invoice.dueDate.toISOString(),
  }));
}
