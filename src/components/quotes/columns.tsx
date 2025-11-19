"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export type Quote = {
  id: string
  number: string
  issueDate: Date
  expiryDate: Date
  subtotal: string
  totalAmount: string
  status: "draft" | "to_send" | "pending" | "refused" | "signed"
  clientName: string
  clientId: string
}

const statusLabels: Record<Quote["status"], string> = {
  draft: "Brouillon",
  to_send: "À envoyer",
  pending: "En attente",
  refused: "Refusé",
  signed: "Signé",
}

const statusVariants: Record<
  Quote["status"],
  "default" | "secondary" | "destructive" | "outline"
> = {
  draft: "secondary",
  to_send: "outline",
  pending: "default",
  refused: "destructive",
  signed: "default",
}

function formatCurrency(amount: string) {
  const num = parseFloat(amount)
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(num)
}

export const columns: ColumnDef<Quote>[] = [
  {
    accessorKey: "status",
    header: "Statut",
    cell: ({ row }) => (
      <Badge variant={statusVariants[row.original.status]}>
        {statusLabels[row.original.status]}
      </Badge>
    ),
    filterFn: (row, id, value) => {
      if (!value || !Array.isArray(value) || value.length === 0) return true
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "clientName",
    header: "Client",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("clientName")}</div>
    ),
  },
  {
    accessorKey: "number",
    header: "Numéro",
    filterFn: (row, id, value) => {
      const searchValue = value.toLowerCase()
      const number = (row.getValue("number") as string).toLowerCase()
      const client = (row.getValue("clientName") as string).toLowerCase()
      return number.includes(searchValue) || client.includes(searchValue)
    },
  },
  {
    accessorKey: "issueDate",
    header: "Date d'émission",
    cell: ({ row }) => {
      return format(new Date(row.getValue("issueDate")), "dd/MM/yyyy", {
        locale: fr,
      })
    },
    filterFn: (row, id, value) => {
      if (!value || (!value.from && !value.to)) return true
      const rowDate = new Date(row.getValue(id))

      if (value.from && value.to) {
        return rowDate >= value.from && rowDate <= value.to
      }
      if (value.from) {
        return rowDate >= value.from
      }
      if (value.to) {
        return rowDate <= value.to
      }
      return true
    },
  },
  {
    accessorKey: "expiryDate",
    header: "Date d'expiration",
    cell: ({ row }) => {
      return format(new Date(row.getValue("expiryDate")), "dd/MM/yyyy", {
        locale: fr,
      })
    },
    filterFn: (row, id, value) => {
      if (!value || (!value.from && !value.to)) return true
      const rowDate = new Date(row.getValue(id))

      if (value.from && value.to) {
        return rowDate >= value.from && rowDate <= value.to
      }
      if (value.from) {
        return rowDate >= value.from
      }
      if (value.to) {
        return rowDate <= value.to
      }
      return true
    },
  },
  {
    accessorKey: "subtotal",
    header: () => <div className="text-right">Total HT</div>,
    cell: ({ row }) => {
      return (
        <div className="text-right">{formatCurrency(row.getValue("subtotal"))}</div>
      )
    },
    filterFn: (row, id, value) => {
      const amount = parseFloat(row.getValue(id) as string)
      const [min, max] = value || [undefined, undefined]
      if (min !== undefined && amount < min) return false
      if (max !== undefined && amount > max) return false
      return true
    },
  },
  {
    accessorKey: "totalAmount",
    header: () => <div className="text-right">Total TTC</div>,
    cell: ({ row }) => {
      return (
        <div className="text-right font-medium">
          {formatCurrency(row.getValue("totalAmount"))}
        </div>
      )
    },
  },
]
