'use client';

import {ChangeEvent, useState} from "react";

export type ExtractedInvoiceData = {
  supplierName: string;
  supplierSiren?: string;
  invoiceNumber: string;
  invoiceDate: string; // ISO format
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  confidence: 'high' | 'medium' | 'low';
  rawText: string; // pour debug
}

export default function InboundInvoicesPage() {
  const [loading, setLoading] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedInvoiceData | null>(null);

  async function handleUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/inbound-invoices', {
      method: 'POST',
      body: formData
    });

    const data = await res.json();
    setExtracted(data);
    setLoading(false);
  }

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleUpload} />
      {loading && <p>Extraction en cours...</p>}
      {JSON.stringify(extracted, null, 2)}
    </div>
  );
}
