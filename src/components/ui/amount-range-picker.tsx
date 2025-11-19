"use client"

import * as React from "react"
import { IconChevronDown, IconX } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface AmountRangePickerProps {
  min?: string
  max?: string
  onMinChange?: (value: string) => void
  onMaxChange?: (value: string) => void
  onClear?: () => void
  placeholder?: string
  className?: string
}

function formatAmount(value: string) {
  if (!value) return null
  const num = parseFloat(value)
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(num)
}

export function AmountRangePicker({
  min,
  max,
  onMinChange,
  onMaxChange,
  onClear,
  placeholder = "Montant HT",
  className,
}: AmountRangePickerProps) {
  const hasValue = min || max

  return (
    <Popover>
      <div className="relative">
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={`w-full justify-between font-normal ${className}`}
          >
            {hasValue ? (
              <span>
                {min && formatAmount(min)}
                {min && max && " - "}
                {max && formatAmount(max)}
              </span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <IconChevronDown className="size-4" />
          </Button>
        </PopoverTrigger>
        {hasValue && onClear && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onClear()
            }}
            className="absolute right-8 top-1/2 -translate-y-1/2 rounded-sm opacity-70 hover:opacity-100 focus:outline-none"
          >
            <IconX className="size-4" />
            <span className="sr-only">Effacer</span>
          </button>
        )}
      </div>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="min-amount" className="text-sm font-medium">
              Montant minimum (€)
            </Label>
            <Input
              id="min-amount"
              type="number"
              placeholder="0"
              value={min}
              onChange={(e) => onMinChange?.(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="max-amount" className="text-sm font-medium">
              Montant maximum (€)
            </Label>
            <Input
              id="max-amount"
              type="number"
              placeholder="10000"
              value={max}
              onChange={(e) => onMaxChange?.(e.target.value)}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
