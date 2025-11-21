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

interface DataTableProps<TData> {
  columns: ColumnDef<TData, any>[]
  data: TData[]
  onFilteredDataChange?: (data: TData[]) => void
  statusFilter?: string | null
  onStatusFilterChange?: (statuses: string[] | null) => void
}

export function DataTable<TData>({
  columns,
  data,
  onFilteredDataChange,
  statusFilter,
  onStatusFilterChange,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })

  // Track si changement provient du parent (évite boucle)
  const isUpdatingFromParent = React.useRef(false)

  // Sync parent statusFilter → columnFilters
  React.useEffect(() => {
    setColumnFilters((prev) => {
      const currentStatus = prev.find((f) => f.id === 'status')
      const currentValue = currentStatus?.value as string[] | undefined
      const withoutStatus = prev.filter((f) => f.id !== 'status')

      // Cas 1: Parent demande filtre single
      if (statusFilter) {
        // Appliquer si différent
        if (!currentValue || currentValue.length !== 1 || currentValue[0] !== statusFilter) {
          isUpdatingFromParent.current = true
          return [...withoutStatus, { id: 'status', value: [statusFilter] }]
        }
      }
      // Cas 2: Parent clear (statusFilter = null) ET filtre actuel est single
      else if (currentValue?.length === 1) {
        isUpdatingFromParent.current = true
        return withoutStatus
      }

      // Cas 3: Pas de changement nécessaire
      return prev
    })
  }, [statusFilter])

  // Remonter changements status au parent (skip si changement du parent)
  React.useEffect(() => {
    if (!onStatusFilterChange) return

    // Skip si le changement vient du parent
    if (isUpdatingFromParent.current) {
      isUpdatingFromParent.current = false
      return
    }

    const currentValue = columnFilters.find((f) => f.id === 'status')?.value as string[] | undefined
    onStatusFilterChange(currentValue || null)
  }, [columnFilters, onStatusFilterChange])

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

    // Pré-calculer filterFns (évite appel répété table.getColumn dans loop)
    const filterFns = filtersWithoutStatus
      .map((filter) => {
        const column = table.getColumn(filter.id)
        return {
          id: filter.id,
          value: filter.value,
          fn: column?.columnDef.filterFn,
        }
      })
      .filter((f) => typeof f.fn === 'function')

    // Si aucun filtre valide, retourner data
    if (filterFns.length === 0) {
      return data
    }

    const coreRows = table.getCoreRowModel().rows

    // Filtrer rows avec filterFns pré-calculées
    const filteredRows = coreRows.filter((row) => {
      return filterFns.every(({ id, value, fn }) =>
        fn!(row, id, value, (val) => val)
      )
    })

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
                    <TableHead key={header.id} style={{ width: header.getSize() }}>
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
                    <TableCell key={cell.id} style={{ width: cell.column.getSize() }}>
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
