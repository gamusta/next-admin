'use client';

import { useState } from 'react';
import { DataTable } from './data-table';
import { columns, type InboundInvoice } from './columns';
import { InboundInvoiceStatusCards } from './inbound-invoice-status-cards';

type InboundInvoiceStatus = 'imported' | 'accepted' | 'paid' | 'refused';

interface InboundInvoicesContentProps {
  invoices: InboundInvoice[];
}

export function InboundInvoicesContent({ invoices }: InboundInvoicesContentProps) {
  const [statusFilter, setStatusFilter] = useState<InboundInvoiceStatus[] | null>(null);

  const handleCardClick = (statuses: InboundInvoiceStatus[]) => {
    // Toggle: click même card = désélection
    setStatusFilter(prev =>
      prev && JSON.stringify(prev) === JSON.stringify(statuses) ? null : statuses
    );
  };

  return (
    <>
      <InboundInvoiceStatusCards
        invoices={invoices}
        onCardClick={handleCardClick}
        selectedStatuses={statusFilter}
      />
      <DataTable
        columns={columns}
        data={invoices}
        statusFilter={statusFilter}
      />
    </>
  );
}
