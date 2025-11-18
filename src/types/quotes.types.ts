import { LineItem, CreateLineItemInput, UpdateLineItemInput } from './line-items.types';

export type QuoteStatus = 'draft' | 'to_send' | 'pending' | 'rejected' | 'signed';

export interface Quote {
  id: string;
  companyId: string;
  clientId: string;
  number: string;
  issueDate: Date;
  expiryDate: Date;
  subtotal: string;
  taxAmount: string;
  totalAmount: string;
  status: QuoteStatus;
  sentAt?: Date;
  signedAt?: Date;
  rejectedAt?: Date;
  notes?: string;
  termsAndConditions?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateQuoteInput {
  clientId: string;
  issueDate: Date;
  expiryDate: Date;
  notes?: string;
  termsAndConditions?: string;
  lineItems: CreateLineItemInput[];
}

export interface UpdateQuoteInput extends Partial<CreateQuoteInput> {
  status?: QuoteStatus;
}

// Avec client et lignes (pour affichage)
export interface QuoteWithRelations extends Quote {
  client: {
    id: string;
    name: string;
    email?: string;
  };
  lineItems: LineItem[];
}
