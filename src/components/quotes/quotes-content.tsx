'use client';

import { useState, useCallback } from 'react';
import { DataTable } from './data-table';
import { columns } from './columns';
import { QuoteStatusCards } from './quote-status-cards';

type QuoteStatus = 'draft' | 'to_send' | 'pending' | 'refused' | 'signed';

interface Quote {
  id: string;
  number: string;
  issueDate: Date;
  expiryDate: Date;
  subtotal: string | number;
  totalAmount: string | number;
  status: QuoteStatus;
  clientName: string;
  clientId: string;
}

interface QuotesContentProps {
  quotes: Quote[];
}

export function QuotesContent({ quotes }: QuotesContentProps) {
  const [selectedStatus, setSelectedStatus] = useState<QuoteStatus | null>(null);
  const [filteredData, setFilteredData] = useState<Quote[]>(quotes);

  const handleStatusClick = (status: QuoteStatus) => {
    // Click card → reset à ce statut uniquement
    setSelectedStatus(selectedStatus === status ? null : status);
  };

  const handleFilteredDataChange = useCallback((data: Quote[]) => {
    setFilteredData(data);
  }, []);

  const handleStatusFilterChange = useCallback((statuses: string[] | null) => {
    // Sync depuis toolbar :
    // - Si 1 statut → surbrillance card
    // - Si plusieurs ou 0 → pas surbrillance
    if (!statuses || statuses.length === 0) {
      setSelectedStatus(null);
    } else if (statuses.length === 1) {
      setSelectedStatus(statuses[0] as QuoteStatus);
    } else {
      // Multi-sélection → pas de surbrillance
      setSelectedStatus(null);
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
