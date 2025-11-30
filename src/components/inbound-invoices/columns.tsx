"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { IconEdit } from "@tabler/icons-react"
import Link from "next/link"

export type InboundInvoice = {
  id: string
  number: string
  issueDate: string // ISO string pour filtres
  dueDate: string // ISO string pour filtres
  issueDateFormatted: string // dd/MM/yyyy pour affichage
  dueDateFormatted: string // dd/MM/yyyy pour affichage
  subtotal: string
  taxAmount: string
  totalAmount: string
  status: "imported" | "accepted" | "paid" | "refused"
  supplierName: string
  supplierId: string | null
  supplierNameExtracted: string | null
}

const statusLabels: Record<InboundInvoice["status"], string> = {
  imported: "À vérifier",
  accepted: "À payer",
  paid: "Payé",
  refused: "Refusé",
}

const statusVariants: Record<
  InboundInvoice["status"],
  "default" | "secondary" | "destructive" | "outline"
> = {
  imported: "outline",
  accepted: "default",
  paid: "secondary",
  refused: "destructive",
}

export const columns: ColumnDef<InboundInvoice>[] = [
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
    accessorKey: "supplierName",
    header: "Fournisseur",
    size: 200,
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("supplierName")}</div>
    ),
  },
  {
    accessorKey: "number",
    header: "Numéro facture",
    size: 150,
    cell: ({ row }) => {
      const number = row.getValue("number") as string
      return number || "-"
    },
    filterFn: (row, id, value) => {
      const searchValue = value.toLowerCase()
      const number = (row.getValue("number") as string).toLowerCase()
      const supplier = (row.getValue("supplierName") as string).toLowerCase()
      return number.includes(searchValue) || supplier.includes(searchValue)
    },
  },
  {
    accessorKey: "issueDate",
    header: "Date facturation",
    size: 140,
    cell: ({ row }) => row.original.issueDateFormatted || "-",
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
    accessorKey: "dueDate",
    header: "Date échéance",
    size: 140,
    cell: ({ row }) => row.original.dueDateFormatted || "-",
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
    accessorKey: "totalAmount",
    header: () => <div className="text-right">Total TTC</div>,
    size: 120,
    cell: ({ row }) => {
      const amount = row.getValue("totalAmount") as string
      return (
        <div className="text-right font-medium">
          {amount && parseFloat(amount) > 0 ? formatCurrency(amount) : "-"}
        </div>
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
    id: "actions",
    header: "Actions",
    size: 100,
    cell: ({ row }) => {
      const invoice = row.original

      // Afficher bouton éditer seulement pour status 'imported'
      if (invoice.status !== "imported") return null

      return (
        <Link href={`/admin/inbound-invoices/${invoice.id}/edit`}>
          <Button variant="ghost" size="sm">
            <IconEdit className="mr-2 size-4" />
            Éditer
          </Button>
        </Link>
      )
    },
  },
]
