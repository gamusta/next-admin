import { getQuotes } from "@/actions/quotes.actions"
import { QuotesContent } from "@/components/quotes/quotes-content"

export default async function QuotesPage() {
  const quotes = await getQuotes()

  return (
    <div className="px-4 lg:px-6">
      <QuotesContent quotes={quotes} />
    </div>
  )
}
