"use client"

import * as React from "react"
import { IconChevronDown, IconX } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export interface FilterOption {
  value: string
  label: string
}

interface MultiSelectFilterProps {
  options: FilterOption[]
  selected: string[]
  onChange: (selected: string[]) => void
  onClear?: () => void
  placeholder?: string
  className?: string
}

export function MultiSelectFilter({
  options,
  selected,
  onChange,
  onClear,
  placeholder = "Sélectionner",
  className,
}: MultiSelectFilterProps) {
  const hasValue = selected.length > 0

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
                {selected.length} sélectionné{selected.length > 1 ? "s" : ""}
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
      <PopoverContent className="w-[200px]" align="start">
        <div className="space-y-2">
          {options.map((option) => {
            const isSelected = selected.includes(option.value)
            return (
              <div
                key={option.value}
                className="flex items-center space-x-2"
              >
                <Checkbox
                  id={`filter-${option.value}`}
                  checked={isSelected}
                  onCheckedChange={(checked) => {
                    const newSelected = checked
                      ? [...selected, option.value]
                      : selected.filter((s) => s !== option.value)
                    onChange(newSelected)
                  }}
                />
                <label
                  htmlFor={`filter-${option.value}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {option.label}
                </label>
              </div>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
