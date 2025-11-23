"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"

export type Quote = {
  id: string
  number: string
  issueDate: string // ISO string pour filtres
  expiryDate: string // ISO string pour filtres
  issueDateFormatted: string // dd/MM/yyyy pour affichage
  expiryDateFormatted: string // dd/MM/yyyy pour affichage
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

export const columns: ColumnDef<Quote>[] = [
  {
    accessorKey: "status",
    header: "Statut",
    size: 130,
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
    size: 200,
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("clientName")}</div>
    ),
  },
  {
    accessorKey: "number",
    header: "Numéro",
    size: 150,
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
    size: 140,
    cell: ({ row }) => row.original.issueDateFormatted,
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
    size: 140,
    cell: ({ row }) => row.original.expiryDateFormatted,
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
    size: 120,
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
    size: 120,
    cell: ({ row }) => {
      return (
        <div className="text-right font-medium">
          {formatCurrency(row.getValue("totalAmount"))}
        </div>
      )
    },
  },
]
