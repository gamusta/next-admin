'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { InboundInvoiceForm } from './inbound-invoice-form';

interface Supplier {
  id: string;
  businessName: string;
  siret: string | null;
  email: string | null;
}

interface InboundInvoiceFormWrapperProps {
  suppliers: Supplier[];
}

interface OCRData {
  supplierName: string;
  supplierSiret?: string;
  supplierAddress?: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate?: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
}

export function InboundInvoiceFormWrapper({ suppliers }: InboundInvoiceFormWrapperProps) {
  const router = useRouter();
  const [ocrData, setOcrData] = useState<OCRData | null>(null);
  const [fileData, setFileData] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  // eslint-disable react-hooks/exhaustive-deps
  useEffect(() => {
    // Récupérer les données depuis sessionStorage
    const storedData = sessionStorage.getItem('invoiceUploadData');

    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        setOcrData(parsed.ocrData);
        setFileData(parsed.fileData);
        setFileName(parsed.fileName);

        // Nettoyer le sessionStorage après utilisation
        sessionStorage.removeItem('invoiceUploadData');
      } catch (error) {
        console.error('Error parsing stored data:', error);
      }
    }
  }, []);

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-4 px-4 lg:px-6">
      {/* Visualisation de la facture (gauche) */}
      <div className="flex-1 overflow-hidden rounded-lg border bg-card">
        {fileData ? (
          <div className="flex h-full flex-col">
            <div className="border-b p-4">
              <h2 className="text-lg font-semibold">Facture uploadée</h2>
              {fileName && (
                <p className="text-sm text-muted-foreground">{fileName}</p>
              )}
            </div>
            <div className="flex-1 overflow-auto p-4">
              <img
                src={fileData}
                alt="Facture"
                className="mx-auto max-w-full"
              />
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            Aucun fichier à afficher
          </div>
        )}
      </div>

      {/* Formulaire (droite) */}
      <div className="w-[600px] overflow-hidden rounded-lg border bg-card">
        <InboundInvoiceForm
          suppliers={suppliers}
          ocrData={ocrData}
          onCancel={() => router.push('/admin/inbound-invoices')}
        />
      </div>
    </div>
  );
}
