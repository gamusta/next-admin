import { z } from 'zod';
import type { inboundInvoices } from '@/lib/db/schema';

// Type DB brut
export type InboundInvoice = typeof inboundInvoices.$inferSelect;

// Type avec relations (pour affichage)
export type InboundInvoiceWithRelations = InboundInvoice & {
  supplier: {
    id: string;
    businessName: string;
    siret: string | null;
    email: string | null;
  };
};

// Status type
export type InboundInvoiceStatus = 'imported' | 'accepted' | 'paid' | 'refused';

// Zod schemas pour validation
export const createInboundInvoiceSchema = z.object({
  supplierId: z.string().uuid('ID fournisseur invalide'),
  number: z.string().min(1, 'Numéro de facture requis'),
  issueDate: z.date({ required_error: 'Date de facturation requise' }),
  dueDate: z.date({ required_error: 'Date d\'échéance requise' }),
  subtotal: z.number().nonnegative('Le montant HT doit être positif'),
  taxAmount: z.number().nonnegative('Le montant de TVA doit être positif'),
  totalAmount: z.number().nonnegative('Le montant TTC doit être positif'),
  paymentMethod: z.string().optional(),
  paymentReference: z.string().optional(),
  notes: z.string().optional(),
}).refine(
  (data) => data.dueDate >= data.issueDate,
  {
    message: 'La date d\'échéance doit être postérieure à la date de facturation',
    path: ['dueDate'],
  }
);

export const updateInboundInvoiceSchema = createInboundInvoiceSchema.partial();

export type CreateInboundInvoiceInput = z.infer<typeof createInboundInvoiceSchema>;
export type UpdateInboundInvoiceInput = z.infer<typeof updateInboundInvoiceSchema>;

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
