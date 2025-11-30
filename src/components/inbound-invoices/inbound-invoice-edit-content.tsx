'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { IconX, IconCheck, IconLoader2 } from '@tabler/icons-react';
import { toast } from 'sonner';
import { acceptInboundInvoice, refuseInboundInvoice, updateInboundInvoiceSupplier } from '@/actions/inbound-invoices.actions';
import { SupplierDialog } from '@/components/suppliers/supplier-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface InboundInvoiceEditContentProps {
  invoice: {
    id: string;
    number: string | null;
    issueDate: Date | null;
    dueDate: Date | null;
    subtotal: string;
    taxAmount: string;
    totalAmount: string;
    status: string;
    notes: string | null;
    fileUrl: string | null;
    ocrData: any;
    supplierId: string | null;
    supplierName: string | null;
  };
  suppliers: Array<{
    id: string;
    businessName: string;
    city: string | null;
    email: string | null;
    phone: string | null;
    siret: string | null;
    isArchived: boolean;
  }>;
}

export function InboundInvoiceEditContent({ invoice, suppliers }: InboundInvoiceEditContentProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('invoice');
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRefusing, setIsRefusing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [showSupplierDialog, setShowSupplierDialog] = useState(false);
  const [showSupplierSelect, setShowSupplierSelect] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(invoice.supplierId);

  // Form state
  const [formData, setFormData] = useState({
    number: invoice.number || '',
    issueDate: invoice.issueDate ? new Date(invoice.issueDate).toISOString().split('T')[0] : '',
    dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : '',
    subtotal: invoice.subtotal,
    taxAmount: invoice.taxAmount,
    totalAmount: invoice.totalAmount,
  });

  // OCR data for supplier dialog
  const supplierOcrData = {
    businessName: invoice.ocrData?.supplierName,
    siret: invoice.ocrData?.supplierSiret,
    email: invoice.ocrData?.supplierEmail,
    phone: invoice.ocrData?.supplierPhone,
    address: invoice.ocrData?.supplierAddress,
    city: invoice.ocrData?.supplierCity,
    postalCode: invoice.ocrData?.supplierPostalCode,
    iban: invoice.ocrData?.supplierIban,
    bic: invoice.ocrData?.supplierBic,
    bankName: invoice.ocrData?.supplierBankName,
  };

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      await acceptInboundInvoice(invoice.id);
      toast.success('Facture validée');
      router.push('/admin/inbound-invoices');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur validation');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleRefuse = async () => {
    setIsRefusing(true);
    try {
      await refuseInboundInvoice(invoice.id, 'Refusée par utilisateur');
      toast.success('Facture refusée');
      router.push('/admin/inbound-invoices');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur refus');
    } finally {
      setIsRefusing(false);
    }
  };

  const handleSupplierDialogChange = (open: boolean) => {
    setShowSupplierDialog(open);
    if (!open) {
      router.refresh();
    }
  };

  const handleConfirmSupplierChange = () => {
    if (!selectedSupplierId) return;

    startTransition(async () => {
      try {
        await updateInboundInvoiceSupplier(invoice.id, selectedSupplierId);
        toast.success('Fournisseur modifié');
        setShowSupplierSelect(false);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Erreur modification');
      }
    });
  };

  return (
    <>
      {/* Supplier Dialog */}
      <SupplierDialog
        open={showSupplierDialog}
        onOpenChange={handleSupplierDialogChange}
        supplier={invoice.supplierId ? {id: invoice.supplierId, businessName: invoice.supplierName || ''} as any : null}
        invoiceId={invoice.id}
        ocrData={supplierOcrData}
      />

      {/* Main Content */}
    <div className="relative flex h-screen gap-6">
      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 top-4 z-50 size-10 rounded-full bg-background shadow-lg hover:bg-accent"
        onClick={() => router.push('/admin/inbound-invoices')}
      >
        <IconX className="size-6" />
      </Button>

      {/* Left Panel - Invoice Image */}
      <div className="flex-1 overflow-hidden bg-muted/50">
        {invoice.fileUrl ? (
          <div className="relative h-full w-full">
            <Image
              src={invoice.fileUrl}
              alt={`Facture ${invoice.number || 'sans numéro'}`}
              fill
              className="object-contain"
              priority
            />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            Aucun fichier disponible
          </div>
        )}
      </div>

      {/* Right Panel - Form */}
      <div className="flex w-[600px] flex-col overflow-hidden bg-card">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex h-full flex-col">
          {/* Sticky Header */}
          <div className="border-b bg-card px-6 py-4">
            <div className="mb-4">
              <h1 className="text-2xl font-bold">
                Facture {invoice.number || '-'}
              </h1>
              <p className="text-sm text-muted-foreground">
                Vérifiez et complétez les informations extraites
              </p>
            </div>

            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="invoice">Facture</TabsTrigger>
              <TabsTrigger value="comments">Commentaires</TabsTrigger>
            </TabsList>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <TabsContent value="invoice" className="mt-0 space-y-6">
              {/* Supplier Section */}
              <Card className="p-6">
                <h2 className="mb-4 text-lg font-semibold">Fournisseur</h2>
                {invoice.supplierId ? (
                  <div className="space-y-3">
                    <p className="font-medium">{invoice.supplierName}</p>
                    {!showSupplierSelect ? (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowSupplierDialog(true)}
                        >
                          Éditer
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowSupplierSelect(true)}
                        >
                          Choisir un autre
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label>Sélectionner un fournisseur</Label>
                        <Select
                          value={selectedSupplierId || undefined}
                          onValueChange={setSelectedSupplierId}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {suppliers.filter(s => !s.isArchived).map((supplier) => (
                              <SelectItem key={supplier.id} value={supplier.id}>
                                {supplier.businessName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setShowSupplierSelect(false);
                              setSelectedSupplierId(invoice.supplierId);
                            }}
                          >
                            Annuler
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={handleConfirmSupplierChange}
                            disabled={isPending || !selectedSupplierId}
                          >
                            Confirmer
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="mb-2 text-sm text-muted-foreground">
                      Aucun fournisseur associé
                    </p>
                    {invoice.ocrData?.supplierName && (
                      <p className="mb-4 text-sm">
                        Nom détecté : <strong>{invoice.ocrData.supplierName}</strong>
                      </p>
                    )}
                    <Button variant="default" size="sm" onClick={() => setShowSupplierDialog(true)}>
                      Créer le fournisseur
                    </Button>
                  </div>
                )}
              </Card>

              {/* Invoice Info */}
              <Card className="p-6">
                <h2 className="mb-4 text-lg font-semibold">Informations de la facture</h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="number">Numéro</Label>
                    <Input
                      id="number"
                      value={formData.number}
                      onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                      placeholder="FA-2024-001"
                    />
                  </div>
                  <div>
                    <Label htmlFor="issueDate">Date facturation</Label>
                    <Input
                      id="issueDate"
                      type="date"
                      value={formData.issueDate}
                      onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dueDate">Date échéance</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label htmlFor="subtotal">HT</Label>
                      <Input
                        id="subtotal"
                        type="number"
                        step="0.01"
                        value={formData.subtotal}
                        onChange={(e) => setFormData({ ...formData, subtotal: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="taxAmount">TVA</Label>
                      <Input
                        id="taxAmount"
                        type="number"
                        step="0.01"
                        value={formData.taxAmount}
                        onChange={(e) => setFormData({ ...formData, taxAmount: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="totalAmount">TTC</Label>
                      <Input
                        id="totalAmount"
                        type="number"
                        step="0.01"
                        value={formData.totalAmount}
                        onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                        className="font-bold"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="comments" className="mt-0">
              <Card className="p-6">
                <p className="text-sm text-muted-foreground">
                  Fonctionnalité commentaires à venir
                </p>
              </Card>
            </TabsContent>
          </div>

          {/* Sticky Footer */}
          <div className="border-t bg-card px-6 py-4">
            <div className="flex gap-2">
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleRefuse}
                disabled={isRefusing || isAccepting}
              >
                {isRefusing ? (
                  <IconLoader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <IconX className="mr-2 size-4" />
                )}
                Refuser
              </Button>
              <Button
                variant="default"
                className="flex-1"
                onClick={handleAccept}
                disabled={isRefusing || isAccepting}
              >
                {isAccepting ? (
                  <IconLoader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <IconCheck className="mr-2 size-4" />
                )}
                Valider
              </Button>
            </div>
          </div>
        </Tabs>
      </div>
    </div>
    </>
  );
}