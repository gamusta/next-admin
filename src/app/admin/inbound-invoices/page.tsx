import { getInboundInvoices } from "@/actions/inbound-invoices.actions"
import { InboundInvoicesContent } from "@/components/inbound-invoices/inbound-invoices-content"

// Revalidate toutes les 60s (ISR) - ajustable selon fréquence màj données
export const revalidate = 60

export default async function InboundInvoicesPage() {
  const invoices = await getInboundInvoices()

  return (
    <div className="px-4 lg:px-6">
      <InboundInvoicesContent invoices={invoices} />
    </div>
  )
}
