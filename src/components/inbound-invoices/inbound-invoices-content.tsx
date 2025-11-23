'use client';

import { useState, useCallback } from 'react';
import { DataTable } from './data-table';
import { columns, type InboundInvoice } from './columns';
import { InboundInvoiceStatusCards } from './inbound-invoice-status-cards';

type InboundInvoiceStatus = 'imported' | 'accepted' | 'paid' | 'refused';

interface InboundInvoicesContentProps {
  invoices: InboundInvoice[];
}

/**
 * Composant wrapper qui coordonne la synchronisation entre :
 * - InboundInvoiceStatusCards (affichage stats + sélection statut)
 * - DataTable (tableau filtrable + toolbar)
 *
 * Flux de données :
 * 1. Click card ’ selectedStatus ’ DataTable ’ columnFilters
 * 2. Toolbar multi-select ’ columnFilters ’ handleStatusFilterChange ’ selectedStatus
 * 3. Filtres non-status ’ DataTable ’ filteredData ’ Cards (recalcul stats)
 */
export function InboundInvoicesContent({ invoices }: InboundInvoicesContentProps) {
  // État pour card sélectionnée (null si 0 ou multi-sélection)
  const [selectedStatus, setSelectedStatus] = useState<InboundInvoiceStatus | null>(null);

  // Données filtrées SANS filtre status (pour calcul stats cards)
  const [filteredData, setFilteredData] = useState<InboundInvoice[]>(invoices);

  /**
   * Handler click card
   * Toggle le statut : click même card = désélection
   */
  const handleStatusClick = (status: InboundInvoiceStatus) => {
    setSelectedStatus(selectedStatus === status ? null : status);
  };

  /**
   * Callback depuis DataTable : données filtrées sans status
   * Utilisé par cards pour calculer stats tous statuts
   */
  const handleFilteredDataChange = useCallback((data: InboundInvoice[]) => {
    setFilteredData(data);
  }, []);

  /**
   * Callback depuis DataTable : changements filtre status (toolbar)
   * Sync selectedStatus pour surbrillance card :
   * - 1 statut ’ surbrillance
   * - 0 ou 2+ ’ pas surbrillance
   */
  const handleStatusFilterChange = useCallback((statuses: string[] | null) => {
    if (!statuses || statuses.length === 0) {
      setSelectedStatus(null);
    } else if (statuses.length === 1) {
      setSelectedStatus(statuses[0] as InboundInvoiceStatus);
    } else {
      setSelectedStatus(null); // Multi-sélection
    }
  }, []);

  return (
    <>
      <InboundInvoiceStatusCards
        invoices={filteredData}
        selectedStatus={selectedStatus}
        onStatusClick={handleStatusClick}
      />
      <DataTable
        columns={columns}
        data={invoices}
        onFilteredDataChange={handleFilteredDataChange}
        statusFilter={selectedStatus}
        onStatusFilterChange={handleStatusFilterChange}
      />
    </>
  );
}
