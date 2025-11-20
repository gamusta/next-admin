"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { QuotesToolbar } from "./quotes-toolbar"
import { DataTablePagination } from "./data-table-pagination"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  onFilteredDataChange?: (data: TData[]) => void
  statusFilter?: string | null
  onStatusFilterChange?: (statuses: string[] | null) => void
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onFilteredDataChange,
  statusFilter,
  onStatusFilterChange,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })

  // Appliquer filtre status depuis parent (cards)
  const prevStatusFilter = React.useRef(statusFilter)
  React.useEffect(() => {
    // Ne sync que si la valeur a vraiment changé
    if (prevStatusFilter.current === statusFilter) return
    prevStatusFilter.current = statusFilter

    setColumnFilters((prev) => {
      const withoutStatus = prev.filter((f) => f.id !== 'status')
      if (statusFilter) {
        return [...withoutStatus, { id: 'status', value: [statusFilter] }]
      }
      return withoutStatus
    })
  }, [statusFilter])

  // Surveiller changements filtre status (depuis toolbar) et remonter au parent
  const prevColumnFilters = React.useRef(columnFilters)
  React.useEffect(() => {
    if (!onStatusFilterChange) return

    const currentStatusValue = columnFilters.find((f) => f.id === 'status')?.value as string[] | undefined
    const prevStatusValue = prevColumnFilters.current.find((f) => f.id === 'status')?.value as string[] | undefined

    // Ne notifier que si le filtre status a changé (pas les autres filtres)
    if (JSON.stringify(currentStatusValue) !== JSON.stringify(prevStatusValue)) {
      // Vérifier que ce n'est pas un changement qu'on a nous-même provoqué
      const isFromCardFilter = currentStatusValue?.length === 1 && currentStatusValue[0] === statusFilter
      if (!isFromCardFilter) {
        onStatusFilterChange(currentStatusValue || null)
      }
    }

    prevColumnFilters.current = columnFilters
  }, [columnFilters, onStatusFilterChange, statusFilter])

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  /**
   * Calculer données filtrées SANS le filtre status (pour cards)
   * Les cards doivent afficher les stats de TOUS les statuts
   * basées sur les autres filtres actifs (dates, montants, search)
   */
  const dataWithoutStatusFilter = React.useMemo(() => {
    const filtersWithoutStatus = columnFilters.filter((f) => f.id !== 'status')

    // Pas de filtres → retourner toutes les données
    if (filtersWithoutStatus.length === 0) {
      return data
    }

    // Récupérer les Row objects de TanStack Table
    const coreRows = table.getCoreRowModel().rows

    // Appliquer tous les filtres SAUF status
    const filteredRows = coreRows.filter((row) => {
      return filtersWithoutStatus.every((filter) => {
        const column = table.getColumn(filter.id)
        if (!column?.columnDef.filterFn) {
          return true
        }
        const filterFn = column.columnDef.filterFn
        if (typeof filterFn === 'function') {
          // filterFn attend un Row object (avec getValue())
          return filterFn(row, filter.id, filter.value, (val) => val)
        }
        return true
      })
    })

    // Retourner les données originales (TData)
    return filteredRows.map((row) => row.original)
  }, [data, columnFilters, table])

  // Remonter au parent
  React.useEffect(() => {
    if (onFilteredDataChange) {
      onFilteredDataChange(dataWithoutStatusFilter)
    }
  }, [dataWithoutStatusFilter, onFilteredDataChange])

  return (
    <div className="flex flex-col gap-4">
      <QuotesToolbar table={table} />

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Aucun devis trouvé
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} />
    </div>
  )
}
