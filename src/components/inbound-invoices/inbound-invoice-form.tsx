'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { format, parse } from 'date-fns';
import {
  IconDeviceFloppy,
  IconX,
  IconCheck,
  IconLoader2,
} from '@tabler/icons-react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import {
  createInboundInvoiceSchema,
  type CreateInboundInvoiceInput,
} from '@/types/inbound-invoices.types';
import {
  createInboundInvoice,
  acceptInboundInvoice,
  refuseInboundInvoice,
} from '@/actions/inbound-invoices.actions';

interface Supplier {
  id: string;
  businessName: string;
  siret: string | null;
  email: string | null;
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

interface InboundInvoiceFormProps {
  suppliers: Supplier[];
  ocrData: OCRData | null;
  onCancel: () => void;
}

export function InboundInvoiceForm({
  suppliers,
  ocrData,
  onCancel,
}: InboundInvoiceFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [comment, setComment] = useState('');
  const [createdInvoiceId, setCreatedInvoiceId] = useState<string | null>(null);

  const form = useForm<CreateInboundInvoiceInput>({
    resolver: zodResolver(createInboundInvoiceSchema),
    defaultValues: {
      supplierId: '',
      number: '',
      issueDate: new Date(),
      dueDate: new Date(),
      subtotal: 0,
      taxAmount: 0,
      totalAmount: 0,
      notes: '',
    },
  });

  // Pré-remplir le formulaire avec les données OCR
  useEffect(() => {
    if (ocrData) {
      // Trouver le fournisseur correspondant
      let matchedSupplier = suppliers.find(
        (s) =>
          s.businessName.toLowerCase().includes(ocrData.supplierName.toLowerCase()) ||
          (ocrData.supplierSiret && s.siret === ocrData.supplierSiret)
      );

      // Parser les dates
      let issueDate: Date;
      try {
        issueDate = new Date(ocrData.issueDate);
      } catch {
        issueDate = new Date();
      }

      let dueDate: Date;
      if (ocrData.dueDate) {
        try {
          dueDate = new Date(ocrData.dueDate);
        } catch {
          dueDate = issueDate;
        }
      } else {
        // Par défaut, échéance = 30 jours après facturation
        dueDate = new Date(issueDate);
        dueDate.setDate(dueDate.getDate() + 30);
      }

      form.reset({
        supplierId: matchedSupplier?.id || '',
        number: ocrData.invoiceNumber,
        issueDate,
        dueDate,
        subtotal: ocrData.subtotal,
        taxAmount: ocrData.taxAmount,
        totalAmount: ocrData.totalAmount,
        notes: ocrData.supplierAddress
          ? `Adresse fournisseur: ${ocrData.supplierAddress}`
          : '',
      });
    }
  }, [ocrData, suppliers, form]);

  const handleSubmit = async (values: CreateInboundInvoiceInput) => {
    setIsSubmitting(true);
    try {
      const invoice = await createInboundInvoice(values);
      setCreatedInvoiceId(invoice.id);
      toast.success('Facture créée avec succès');
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error(
        error instanceof Error ? error.message : 'Erreur lors de la création'
      );
      setIsSubmitting(false);
    }
  };

  const handleAccept = async () => {
    if (!createdInvoiceId) return;

    setIsSubmitting(true);
    try {
      await acceptInboundInvoice(createdInvoiceId);
      toast.success('Facture acceptée');
      router.push('/admin/inbound-invoices');
    } catch (error) {
      console.error('Error accepting invoice:', error);
      toast.error('Erreur lors de l\'acceptation');
      setIsSubmitting(false);
    }
  };

  const handleRefuse = async () => {
    if (!createdInvoiceId) return;

    if (!comment.trim()) {
      toast.error('Veuillez ajouter un commentaire expliquant le refus');
      return;
    }

    setIsSubmitting(true);
    try {
      await refuseInboundInvoice(createdInvoiceId, comment);
      toast.success('Facture refusée');
      router.push('/admin/inbound-invoices');
    } catch (error) {
      console.error('Error refusing invoice:', error);
      toast.error('Erreur lors du refus');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b p-4">
        <h1 className="text-2xl font-bold">
          {createdInvoiceId ? 'Valider la facture' : 'Nouvelle facture d\'achat'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {createdInvoiceId
            ? 'Vérifiez les informations et acceptez ou refusez la facture'
            : 'Vérifiez et complétez les informations extraites'}
        </p>
      </div>

      {/* Content with tabs */}
      <div className="flex-1 overflow-auto p-4">
        <Tabs defaultValue="invoice" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="invoice">Facture</TabsTrigger>
            <TabsTrigger value="comments">Commentaires</TabsTrigger>
          </TabsList>

          <TabsContent value="invoice" className="space-y-4 pt-4">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-4"
              >
                {/* Fournisseur */}
                <FormField
                  control={form.control}
                  name="supplierId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fournisseur *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!!createdInvoiceId}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un fournisseur" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {suppliers.map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.id}>
                              {supplier.businessName}
                              {supplier.siret && (
                                <span className="text-muted-foreground">
                                  {' '}
                                  - {supplier.siret}
                                </span>
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Numéro facture */}
                <FormField
                  control={form.control}
                  name="number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Numéro de facture *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="FAC-2024-001"
                          disabled={!!createdInvoiceId}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Dates */}
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="issueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date de facturation *</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            value={
                              field.value instanceof Date
                                ? format(field.value, 'yyyy-MM-dd')
                                : ''
                            }
                            onChange={(e) => {
                              const date = e.target.value
                                ? new Date(e.target.value)
                                : new Date();
                              field.onChange(date);
                            }}
                            disabled={!!createdInvoiceId}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date d&apos;échéance *</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            value={
                              field.value instanceof Date
                                ? format(field.value, 'yyyy-MM-dd')
                                : ''
                            }
                            onChange={(e) => {
                              const date = e.target.value
                                ? new Date(e.target.value)
                                : new Date();
                              field.onChange(date);
                            }}
                            disabled={!!createdInvoiceId}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Montants */}
                <div className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="subtotal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Montant HT *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || 0)
                            }
                            disabled={!!createdInvoiceId}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="taxAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Montant TVA *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || 0)
                            }
                            disabled={!!createdInvoiceId}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="totalAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Montant TTC *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || 0)
                            }
                            disabled={!!createdInvoiceId}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Notes */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Notes ou informations complémentaires..."
                          rows={3}
                          disabled={!!createdInvoiceId}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Bouton de sauvegarde (uniquement si pas encore créée) */}
                {!createdInvoiceId && (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    {isSubmitting ? (
                      <>
                        <IconLoader2 className="mr-2 size-4 animate-spin" />
                        Création...
                      </>
                    ) : (
                      <>
                        <IconDeviceFloppy className="mr-2 size-4" />
                        Créer la facture
                      </>
                    )}
                  </Button>
                )}
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="comments" className="space-y-4 pt-4">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="comment"
                  className="mb-2 block text-sm font-medium"
                >
                  Ajouter un commentaire
                </label>
                <Textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Commentaire sur la facture..."
                  rows={5}
                  disabled={!createdInvoiceId}
                />
                {!createdInvoiceId && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Créez d&apos;abord la facture pour ajouter des commentaires
                  </p>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer avec boutons Valider/Refuser */}
      {createdInvoiceId && (
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1"
            >
              <IconX className="mr-2 size-4" />
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleRefuse}
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <IconLoader2 className="mr-2 size-4 animate-spin" />
                  Refus...
                </>
              ) : (
                <>
                  <IconX className="mr-2 size-4" />
                  Refuser
                </>
              )}
            </Button>
            <Button
              onClick={handleAccept}
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <IconLoader2 className="mr-2 size-4 animate-spin" />
                  Validation...
                </>
              ) : (
                <>
                  <IconCheck className="mr-2 size-4" />
                  Valider
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
