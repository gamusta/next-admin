export type LineItemType = 'product' | 'service';

// ============================================
// ENTITÉ (DB)
// ============================================
export interface LineItem {
  id: string;
  quoteId?: string;
  invoiceId?: string;
  type: LineItemType;
  description: string;
  quantity: string;      // numeric en DB
  unitPrice: string;     // numeric en DB
  taxRate: string;       // numeric en DB (ex: "20.00" pour 20%)
  subtotal: string;      // Calculé
  taxAmount: string;     // Calculé
  totalAmount: string;   // Calculé
  position: number;      // Ordre d'affichage
}

// ============================================
// INPUTS (Formulaires / Server Actions)
// ============================================
export interface CreateLineItemInput {
  type: LineItemType;
  description: string;
  quantity: number;       // Number en input
  unitPrice: number;      // Number en input
  taxRate?: number;       // Optionnel, défaut 20%
}

export interface UpdateLineItemInput extends Partial<CreateLineItemInput> {
  id?: string; // Pour identifier quel item modifier
}

// ============================================
// HELPERS / COMPUTED
// ============================================
export interface LineItemCalculated extends LineItem {
  // Versions numériques pour calculs
  quantityNum: number;
  unitPriceNum: number;
  taxRateNum: number;
  subtotalNum: number;
  taxAmountNum: number;
  totalAmountNum: number;
}
