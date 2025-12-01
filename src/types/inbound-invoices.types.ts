import { z } from 'zod';
import type { inboundInvoices, inboundInvoicePayments, inboundInvoiceComments } from '@/lib/db/schema';

// Type DB brut
export type InboundInvoice = typeof inboundInvoices.$inferSelect;
export type InboundInvoicePayment = typeof inboundInvoicePayments.$inferSelect;
export type InboundInvoiceComment = typeof inboundInvoiceComments.$inferSelect;

// Type avec relations (pour affichage détaillé)
export type InboundInvoiceWithRelations = InboundInvoice & {
  supplier: {
    id: string;
    businessName: string;
    siret: string | null;
    email: string | null;
  };
  payments: InboundInvoicePayment[];
  comments: (InboundInvoiceComment & {
    user: {
      id: string;
      name: string | null;
      email: string;
    };
  })[];
};

// Status et Payment Method types
export type InboundInvoiceStatus = 'imported' | 'accepted' | 'paid' | 'refused';
export type PaymentMethod = 'card' | 'transfer' | 'debit' | 'credit_note' | 'check' | 'cash';

// Labels pour l'UI
export const paymentMethodLabels: Record<PaymentMethod, string> = {
  card: 'Carte Bancaire',
  transfer: 'Virement',
  debit: 'Prélèvement',
  credit_note: 'Avoir',
  check: 'Chèque',
  cash: 'Espèce',
};

// Zod schemas pour validation
export const createInboundInvoiceSchema = z.object({
  supplierId: z.uuid('ID fournisseur invalide').nullable(),
  number: z.string().min(1, 'Numéro de facture requis').nullable(),
  issueDate: z.date({ message: 'Date de facturation requise' }).nullable(),
  dueDate: z.date({ message: 'Date d\'échéance requise' }).nullable(),
  subtotal: z.number().nonnegative('Le montant HT doit être positif').nullable(),
  taxAmount: z.number().nonnegative('Le montant de TVA doit être positif').nullable(),
  totalAmount: z.number().nonnegative('Le montant TTC doit être positif').nullable(),
  notes: z.string().optional(),
}).refine(
  (data) => !data.dueDate || !data.issueDate || data.dueDate >= data.issueDate,
  {
    message: 'La date d\'échéance doit être postérieure à la date de facturation',
    path: ['dueDate'],
  }
);

export const updateInboundInvoiceSchema = createInboundInvoiceSchema.partial();

export type CreateInboundInvoiceInput = z.infer<typeof createInboundInvoiceSchema>;
export type UpdateInboundInvoiceInput = z.infer<typeof updateInboundInvoiceSchema>;

// Schema pour paiements
export const createPaymentSchema = z.object({
  inboundInvoiceId: z.uuid('ID facture invalide'),
  amount: z.number().positive('Le montant doit être positif'),
  paymentDate: z.coerce.date({ message: 'Date de paiement requise' }),
  paymentMethod: z.enum(['card', 'transfer', 'debit', 'credit_note', 'check', 'cash']),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;

// Schema pour commentaires
export const createCommentSchema = z.object({
  inboundInvoiceId: z.uuid('ID facture invalide'),
  content: z.string().min(1, 'Le commentaire ne peut pas être vide'),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;

// Filtres pour la liste
export type InboundInvoiceFilters = {
  search?: string;
  status?: InboundInvoiceStatus[];
  issueDateFrom?: Date;
  issueDateTo?: Date;
  dueDateFrom?: Date;
  dueDateTo?: Date;
  minAmount?: number;
  maxAmount?: number;
};
