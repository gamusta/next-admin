import { notFound } from 'next/navigation';
import { getInboundInvoiceById } from '@/actions/inbound-invoices.actions';
import { getSuppliers } from '@/actions/suppliers.actions';
import { InboundInvoiceEditContent } from '@/components/inbound-invoices/inbound-invoice-edit-content';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function InboundInvoiceEditPage({ params }: PageProps) {
  const { id } = await params;

  let invoice;
  try {
    invoice = await getInboundInvoiceById(id);
  } catch (error) {
    console.error('Error loading invoice:', error);
    notFound();
  }

  const suppliers = await getSuppliers();

  return <InboundInvoiceEditContent invoice={invoice} suppliers={suppliers} />;
}