'use client';

import { useState, useCallback } from 'react';
import { DataTable } from './data-table';
import { columns } from './columns';
import { QuoteStatusCards } from './quote-status-cards';

type QuoteStatus = 'draft' | 'to_send' | 'pending' | 'refused' | 'signed';

interface Quote {
  id: string;
  number: string;
  issueDate: string; // ISO string
  expiryDate: string; // ISO string
  issueDateFormatted: string; // dd/MM/yyyy
  expiryDateFormatted: string; // dd/MM/yyyy
  subtotal: string | number;
  totalAmount: string | number;
  status: QuoteStatus;
  clientName: string;
  clientId: string;
}

interface QuotesContentProps {
  quotes: Quote[];
}

/**
 * Composant wrapper qui coordonne la synchronisation entre :
 * - QuoteStatusCards (affichage stats + sélection statut)
 * - DataTable (tableau filtrable + toolbar)
 *
 * Flux de données :
 * 1. Click card → selectedStatus → DataTable → columnFilters
 * 2. Toolbar multi-select → columnFilters → handleStatusFilterChange → selectedStatus
 * 3. Filtres non-status → DataTable → filteredData → Cards (recalcul stats)
 */
export function QuotesContent({ quotes }: QuotesContentProps) {
  // État pour card sélectionnée (null si 0 ou multi-sélection)
  const [selectedStatus, setSelectedStatus] = useState<QuoteStatus | null>(null);

  // Données filtrées SANS filtre status (pour calcul stats cards)
  const [filteredData, setFilteredData] = useState<Quote[]>(quotes);

  /**
   * Handler click card
   * Toggle le statut : click même card = désélection
   */
  const handleStatusClick = (status: QuoteStatus) => {
    setSelectedStatus(selectedStatus === status ? null : status);
  };

  /**
   * Callback depuis DataTable : données filtrées sans status
   * Utilisé par cards pour calculer stats tous statuts
   */
  const handleFilteredDataChange = useCallback((data: Quote[]) => {
    setFilteredData(data);
  }, []);

  /**
   * Callback depuis DataTable : changements filtre status (toolbar)
   * Sync selectedStatus pour surbrillance card :
   * - 1 statut → surbrillance
   * - 0 ou 2+ → pas surbrillance
   */
  const handleStatusFilterChange = useCallback((statuses: string[] | null) => {
    if (!statuses || statuses.length === 0) {
      setSelectedStatus(null);
    } else if (statuses.length === 1) {
      setSelectedStatus(statuses[0] as QuoteStatus);
    } else {
      setSelectedStatus(null); // Multi-sélection
    }
  }, []);

  return (
    <>
      <QuoteStatusCards
        quotes={filteredData}
        selectedStatus={selectedStatus}
        onStatusClick={handleStatusClick}
      />
      <DataTable
        columns={columns}
        data={quotes}
        onFilteredDataChange={handleFilteredDataChange}
        statusFilter={selectedStatus}
        onStatusFilterChange={handleStatusFilterChange}
      />
    </>
  );
}
