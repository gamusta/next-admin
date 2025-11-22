"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { IconPencil, IconTrash, IconArchive } from "@tabler/icons-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { IconDotsVertical } from "@tabler/icons-react"

export type Supplier = {
  id: string
  businessName: string
  city: string | null
  email: string | null
  phone: string | null
  siret: string | null
  isArchived: boolean
}

export const columns: ColumnDef<Supplier>[] = [
  {
    accessorKey: "businessName",
    header: "Raison sociale",
    size: 250,
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("businessName")}</div>
    ),
    filterFn: (row, id, value) => {
      const searchValue = value.toLowerCase()
      const businessName = (row.getValue("businessName") as string).toLowerCase()
      const city = ((row.getValue("city") as string) || "").toLowerCase()
      return businessName.includes(searchValue) || city.includes(searchValue)
    },
  },
  {
    accessorKey: "city",
    header: "Ville",
    size: 150,
    cell: ({ row }) => (
      <div className="text-muted-foreground">
        {row.getValue("city") || "-"}
      </div>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
    size: 200,
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">
        {row.getValue("email") || "-"}
      </div>
    ),
  },
  {
    accessorKey: "phone",
    header: "Téléphone",
    size: 150,
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">
        {row.getValue("phone") || "-"}
      </div>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    size: 80,
    cell: ({ row, table }) => {
      const supplier = row.original
      const meta = table.options.meta as {
        onEdit?: (supplier: Supplier) => void
        onDelete?: (id: string) => void
        onToggleArchive?: (id: string) => void
      } | undefined

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <span className="sr-only">Ouvrir menu</span>
              <IconDotsVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => meta?.onEdit?.(supplier)}
              className="cursor-pointer"
            >
              <IconPencil className="mr-2 h-4 w-4" />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => meta?.onToggleArchive?.(supplier.id)}
              className="cursor-pointer"
            >
              <IconArchive className="mr-2 h-4 w-4" />
              {supplier.isArchived ? "Désarchiver" : "Archiver"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => meta?.onDelete?.(supplier.id)}
              className="cursor-pointer text-destructive"
            >
              <IconTrash className="mr-2 h-4 w-4" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
