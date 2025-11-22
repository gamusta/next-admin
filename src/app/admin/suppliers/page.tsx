import { getSuppliers } from "@/actions/suppliers.actions"
import { SuppliersContent } from "@/components/suppliers/suppliers-content"

export const revalidate = 60

export default async function SuppliersPage() {
  const suppliers = await getSuppliers()

  return (
    <div className="px-4 lg:px-6">
      <SuppliersContent suppliers={suppliers} />
    </div>
  )
}
