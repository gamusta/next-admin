"use client"

import * as React from "react"
import { Table } from "@tanstack/react-table"
import { IconSearch } from "@tabler/icons-react"
import { type DateRange } from "react-day-picker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DatePickerRange } from "@/components/ui/date-picker-range"
import { AmountRangePicker } from "@/components/ui/amount-range-picker"

interface InboundInvoicesToolbarProps<TData> {
  table: Table<TData>
}

export function InboundInvoicesToolbar<TData>({ table }: InboundInvoicesToolbarProps<TData>) {
  const [issueDateRange, setIssueDateRange] = React.useState<DateRange | undefined>()
  const [dueDateRange, setDueDateRange] = React.useState<DateRange | undefined>()
  const [minAmount, setMinAmount] = React.useState<string>("")
  const [maxAmount, setMaxAmount] = React.useState<string>("")

  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-card p-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Recherche */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="search" className="text-sm font-medium">
            Recherche
          </Label>
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Numéro ou fournisseur..."
              value={(table.getColumn("number")?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn("number")?.setFilterValue(event.target.value)
              }
              className="pl-9"
            />
          </div>
        </div>

        {/* Filtre Date facturation */}
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-medium">
            Date de facturation
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

        {/* Filtre Date échéance */}
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-medium">
            Date d&apos;échéance
          </Label>
          <DatePickerRange
            value={dueDateRange}
            onChange={(range) => {
              setDueDateRange(range)
              table.getColumn("dueDate")?.setFilterValue(range)
            }}
            onClear={() => {
              setDueDateRange(undefined)
              table.getColumn("dueDate")?.setFilterValue(undefined)
            }}
            placeholder="Sélectionner période"
          />
        </div>

        {/* Filtre Montant TTC */}
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-medium">Montant TTC</Label>
          <AmountRangePicker
            min={minAmount}
            max={maxAmount}
            onMinChange={(value) => {
              setMinAmount(value)
              table.getColumn("totalAmount")?.setFilterValue((old: [number?, number?] | undefined) => [
                value ? parseFloat(value) : undefined,
                old?.[1],
              ])
            }}
            onMaxChange={(value) => {
              setMaxAmount(value)
              table.getColumn("totalAmount")?.setFilterValue((old: [number?, number?] | undefined) => [
                old?.[0],
                value ? parseFloat(value) : undefined,
              ])
            }}
            onClear={() => {
              setMinAmount("")
              setMaxAmount("")
              table.getColumn("totalAmount")?.setFilterValue(undefined)
            }}
            placeholder="Montant TTC"
          />
        </div>
      </div>
    </div>
  )
}
