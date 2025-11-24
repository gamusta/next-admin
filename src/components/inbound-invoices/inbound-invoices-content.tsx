'use client';

import { useState } from 'react';
import { DataTable } from './data-table';
import { columns, type InboundInvoice } from './columns';
import { InboundInvoiceStatusCards } from './inbound-invoice-status-cards';
import { UploadInvoiceDialog } from './upload-invoice-dialog';
import { Button } from '@/components/ui/button';
import { IconUpload } from '@tabler/icons-react';

type InboundInvoiceStatus = 'imported' | 'accepted' | 'paid' | 'refused';

interface InboundInvoicesContentProps {
  invoices: InboundInvoice[];
}

export function InboundInvoicesContent({ invoices }: InboundInvoicesContentProps) {
  const [statusFilter, setStatusFilter] = useState<InboundInvoiceStatus[] | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  const handleCardClick = (statuses: InboundInvoiceStatus[]) => {
    // Toggle: click même card = désélection
    setStatusFilter(prev =>
      prev && JSON.stringify(prev) === JSON.stringify(statuses) ? null : statuses
    );
  };

  return (
    <>
      {/* Header avec bouton d'upload */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Factures d&apos;achat</h1>
          <p className="text-muted-foreground">
            Gérez vos factures fournisseurs
          </p>
        </div>
        <Button onClick={() => setUploadDialogOpen(true)}>
          <IconUpload className="mr-2 size-4" />
          Importer une facture
        </Button>
      </div>

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

      <UploadInvoiceDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
      />
    </>
  );
}
