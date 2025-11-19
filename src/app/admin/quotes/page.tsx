import { getQuotes } from "@/actions/quotes.actions"
import { DataTable } from "@/components/quotes/data-table"
import { columns } from "@/components/quotes/columns"

export default async function QuotesPage() {
  const quotes = await getQuotes()

  return (
    <div className="px-4 lg:px-6">
      <DataTable columns={columns} data={quotes} />
    </div>
  )
}
