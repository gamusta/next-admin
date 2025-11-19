"use client"

import * as React from "react"
import { IconChevronDown, IconX } from "@tabler/icons-react"
import { type DateRange } from "react-day-picker"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface DatePickerRangeProps {
  value?: DateRange
  onChange?: (range: DateRange | undefined) => void
  onClear?: () => void
  placeholder?: string
  className?: string
}

export function DatePickerRange({
  value,
  onChange,
  onClear,
  placeholder = "Sélectionner une période",
  className,
}: DatePickerRangeProps) {
  const hasValue = value?.from || value?.to

  return (
    <Popover>
      <div className="relative">
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={`w-full justify-between font-normal ${className}`}
          >
            {value?.from && value?.to ? (
              <>
                {format(value.from, "dd/MM/yyyy", { locale: fr })} -{" "}
                {format(value.to, "dd/MM/yyyy", { locale: fr })}
              </>
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
      <PopoverContent className="w-auto overflow-hidden p-0" align="start">
        <Calendar
          mode="range"
          selected={value}
          onSelect={onChange}
          numberOfMonths={2}
          locale={fr}
        />
      </PopoverContent>
    </Popover>
  )
}
