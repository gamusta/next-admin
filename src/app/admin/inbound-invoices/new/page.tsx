import { Suspense } from 'react';
import { InboundInvoiceFormWrapper } from '@/components/inbound-invoices/inbound-invoice-form-wrapper';
import { getSuppliers } from '@/actions/suppliers.actions';

export default async function NewInboundInvoicePage() {
  const suppliers = await getSuppliers();

  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <InboundInvoiceFormWrapper suppliers={suppliers} />
    </Suspense>
  );
}
