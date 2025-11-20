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
    setSelectedStatus(selectedStatus === status ? null : status);
  };

  const handleFilteredDataChange = useCallback((data: Quote[]) => {
    setFilteredData(data);
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
      />
    </>
  );
}
