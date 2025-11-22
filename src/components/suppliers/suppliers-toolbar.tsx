"use client"

import * as React from "react"
import { Table } from "@tanstack/react-table"
import { IconSearch } from "@tabler/icons-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface SuppliersToolbarProps<TData> {
  table: Table<TData>
}

export function SuppliersToolbar<TData>({ table }: SuppliersToolbarProps<TData>) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-card p-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="search" className="text-sm font-medium">
          Recherche
        </Label>
        <div className="relative">
          <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="search"
            placeholder="Raison sociale ou ville..."
            value={(table.getColumn("businessName")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("businessName")?.setFilterValue(event.target.value)
            }
            className="pl-9"
          />
        </div>
      </div>
    </div>
  )
}
