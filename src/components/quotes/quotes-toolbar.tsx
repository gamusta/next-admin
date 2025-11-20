"use client"

import * as React from "react"
import { Table } from "@tanstack/react-table"
import { IconSearch } from "@tabler/icons-react"
import { type DateRange } from "react-day-picker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DatePickerRange } from "@/components/ui/date-picker-range"
import { AmountRangePicker } from "@/components/ui/amount-range-picker"
import { MultiSelectFilter, type FilterOption } from "@/components/ui/multi-select-filter"

interface QuotesToolbarProps<TData> {
  table: Table<TData>
}

const statusOptions: FilterOption[] = [
  { value: "draft", label: "Brouillon" },
  { value: "to_send", label: "À envoyer" },
  { value: "pending", label: "En attente" },
  { value: "refused", label: "Refusé" },
  { value: "signed", label: "Signé" },
]

export function QuotesToolbar<TData>({ table }: QuotesToolbarProps<TData>) {
  const columnFilters = table.getState().columnFilters
  const [issueDateRange, setIssueDateRange] = React.useState<DateRange | undefined>()
  const [expiryDateRange, setExpiryDateRange] = React.useState<DateRange | undefined>()
  const [selectedStatuses, setSelectedStatuses] = React.useState<string[]>([])
  const [minAmount, setMinAmount] = React.useState<string>("")
  const [maxAmount, setMaxAmount] = React.useState<string>("")

  // Sync selectedStatuses depuis columnFilters (cards → toolbar)
  React.useEffect(() => {
    const statusFilter = columnFilters.find((f) => f.id === 'status')?.value as string[] | undefined
    setSelectedStatuses(statusFilter || [])
  }, [columnFilters])

  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-card p-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {/* Recherche */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="search" className="text-sm font-medium">
            Recherche
          </Label>
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Numéro ou client..."
              value={(table.getColumn("number")?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn("number")?.setFilterValue(event.target.value)
              }
              className="pl-9"
            />
          </div>
        </div>

        {/* Filtre Statut */}
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-medium">Statut</Label>
          <MultiSelectFilter
            options={statusOptions}
            selected={selectedStatuses}
            onChange={(newStatuses) => {
              setSelectedStatuses(newStatuses)
              table
                .getColumn("status")
                ?.setFilterValue(newStatuses.length > 0 ? newStatuses : undefined)
            }}
            onClear={() => {
              setSelectedStatuses([])
              table.getColumn("status")?.setFilterValue(undefined)
            }}
            placeholder="Tous les statuts"
          />
        </div>

        {/* Filtre Date émission */}
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-medium">
            Date d&apos;émission
          </Label>
          <DatePickerRange
            value={issueDateRange}
            onChange={(range) => {
              setIssueDateRange(range)
              table.getColumn("issueDate")?.setFilterValue(range)
            }}
            onClear={() => {
              setIssueDateRange(undefined)
              table.getColumn("issueDate")?.setFilterValue(undefined)
            }}
            placeholder="Sélectionner période"
          />
        </div>

        {/* Filtre Date expiration */}
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-medium">
            Date d&apos;expiration
          </Label>
          <DatePickerRange
            value={expiryDateRange}
            onChange={(range) => {
              setExpiryDateRange(range)
              table.getColumn("expiryDate")?.setFilterValue(range)
            }}
            onClear={() => {
              setExpiryDateRange(undefined)
              table.getColumn("expiryDate")?.setFilterValue(undefined)
            }}
            placeholder="Sélectionner période"
          />
        </div>

        {/* Filtre Montant HT */}
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-medium">Montant HT</Label>
          <AmountRangePicker
            min={minAmount}
            max={maxAmount}
            onMinChange={(value) => {
              setMinAmount(value)
              table.getColumn("subtotal")?.setFilterValue((old: [number?, number?] | undefined) => [
                value ? parseFloat(value) : undefined,
                old?.[1],
              ])
            }}
            onMaxChange={(value) => {
              setMaxAmount(value)
              table.getColumn("subtotal")?.setFilterValue((old: [number?, number?] | undefined) => [
                old?.[0],
                value ? parseFloat(value) : undefined,
              ])
            }}
            onClear={() => {
              setMinAmount("")
              setMaxAmount("")
              table.getColumn("subtotal")?.setFilterValue(undefined)
            }}
            placeholder="Montant HT"
          />
        </div>
      </div>
    </div>
  )
}
