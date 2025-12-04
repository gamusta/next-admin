import { z } from 'zod';

/**
 * Types de documents supportés
 */
export type DocumentType = 'inbound-invoice' | 'expense-report' | 'receipt';

/**
 * Configuration pour chaque type de document
 */
export interface DocumentConfig<T extends z.ZodTypeAny = z.ZodTypeAny> {
  type: DocumentType;
  schema: T;
  prompt: (ocrText: string) => string;
  systemMessage?: string;
}

// ============================================================================
// SCHEMAS PAR TYPE DE DOCUMENT
// ============================================================================

/**
 * Schema facture d'achat
 */
export const inboundInvoiceSchema = z.object({
  supplierName: z.string().nullable(),
  supplierSiret: z.string().nullable().optional(),
  supplierAddress: z.string().nullable().optional(),
  supplierCity: z.string().nullable().optional(),
  supplierPostalCode: z.string().nullable().optional(),
  supplierPhone: z.string().nullable().optional(),
  supplierEmail: z.string().nullable().optional(),
  supplierBankName: z.string().nullable().optional(),
  supplierBic: z.string().nullable().optional(),
  supplierIban: z.string().nullable().optional(),
  invoiceNumber: z.string().nullable(),
  issueDate: z.string().nullable(),
  dueDate: z.string().nullable().optional(),
  subtotal: z.number().nullable(),
  taxAmount: z.number().nullable(),
  totalAmount: z.number().nullable(),
  currency: z.string().nullable().optional(),
  confidence: z.enum(['high', 'medium', 'low']).nullable().optional(),
});

export type InboundInvoiceData = z.infer<typeof inboundInvoiceSchema>;

/**
 * Schema note de frais
 */
export const expenseReportSchema = z.object({
  employeeName: z.string().nullable(),
  employeeId: z.string().nullable().optional(),
  reportDate: z.string().nullable(),
  expenseDate: z.string().nullable(),
  category: z.string().nullable(), // restaurant, transport, hotel, etc
  merchant: z.string().nullable(),
  amount: z.number().nullable(),
  currency: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  paymentMethod: z.string().nullable().optional(), // card, cash, etc
  confidence: z.enum(['high', 'medium', 'low']).nullable().optional(),
});

export type ExpenseReportData = z.infer<typeof expenseReportSchema>;

/**
 * Schema ticket de caisse simple
 */
export const receiptSchema = z.object({
  merchantName: z.string().nullable(),
  merchantAddress: z.string().nullable().optional(),
  receiptNumber: z.string().nullable().optional(),
  date: z.string().nullable(),
  time: z.string().nullable().optional(),
  totalAmount: z.number().nullable(),
  taxAmount: z.number().nullable().optional(),
  currency: z.string().nullable().optional(),
  paymentMethod: z.string().nullable().optional(),
  confidence: z.enum(['high', 'medium', 'low']).nullable().optional(),
});

export type ReceiptData = z.infer<typeof receiptSchema>;

// ============================================================================
// PROMPTS PAR TYPE DE DOCUMENT
// ============================================================================

function getInboundInvoicePrompt(ocrText: string): string {
  return `Analyse ce texte OCR de facture française et extrait les informations au format JSON strict :

${ocrText}

Format JSON attendu (sans markdown, juste JSON brut):
{
  "supplierName": "Nom fournisseur",
  "supplierSiret": "SIRET 14 chiffres",
  "supplierAddress": "Adresse complète",
  "supplierCity": "Ville",
  "supplierPostalCode": "Code postal",
  "supplierPhone": "Téléphone",
  "supplierEmail": "Email",
  "supplierBankName": "Nom banque",
  "supplierBic": "BIC",
  "supplierIban": "IBAN",
  "invoiceNumber": "Numéro facture",
  "issueDate": "YYYY-MM-DD",
  "dueDate": "YYYY-MM-DD",
  "subtotal": montant HT (nombre),
  "taxAmount": montant TVA (nombre),
  "totalAmount": montant TTC (nombre),
  "currency": "EUR",
  "confidence": "high|medium|low"
}

IMPORTANT:
- Réponds UNIQUEMENT avec JSON
- Montants = nombres (pas strings)
- Dates = YYYY-MM-DD
- Si manquant = null
- confidence: high si tout clair, medium si zones floues, low si incertain`;
}

function getExpenseReportPrompt(ocrText: string): string {
  return `Analyse ce texte OCR de note de frais et extrait les informations au format JSON strict :

${ocrText}

Format JSON attendu (sans markdown, juste JSON brut):
{
  "employeeName": "Nom employé",
  "employeeId": "ID employé si présent",
  "reportDate": "YYYY-MM-DD",
  "expenseDate": "YYYY-MM-DD",
  "category": "restaurant|transport|hotel|fournitures|autre",
  "merchant": "Nom commerçant",
  "amount": montant (nombre),
  "currency": "EUR",
  "description": "Description frais",
  "paymentMethod": "card|cash|transfer",
  "confidence": "high|medium|low"
}

IMPORTANT:
- Réponds UNIQUEMENT avec JSON
- Montants = nombres
- Dates = YYYY-MM-DD
- Si manquant = null
- confidence: high si tout clair, medium si zones floues, low si incertain`;
}

function getReceiptPrompt(ocrText: string): string {
  return `Analyse ce texte OCR de ticket de caisse et extrait les informations au format JSON strict :

${ocrText}

Format JSON attendu (sans markdown, juste JSON brut):
{
  "merchantName": "Nom commerce",
  "merchantAddress": "Adresse",
  "receiptNumber": "N° ticket",
  "date": "YYYY-MM-DD",
  "time": "HH:MM",
  "totalAmount": montant total (nombre),
  "taxAmount": montant TVA (nombre),
  "currency": "EUR",
  "paymentMethod": "card|cash|autre",
  "confidence": "high|medium|low"
}

IMPORTANT:
- Réponds UNIQUEMENT avec JSON
- Montants = nombres
- Dates = YYYY-MM-DD, time = HH:MM
- Si manquant = null
- confidence: high si tout clair, medium si zones floues, low si incertain`;
}

// ============================================================================
// CONFIGURATIONS PAR TYPE DE DOCUMENT
// ============================================================================

export const inboundInvoiceConfig: DocumentConfig<typeof inboundInvoiceSchema> = {
  type: 'inbound-invoice',
  schema: inboundInvoiceSchema,
  prompt: getInboundInvoicePrompt,
  systemMessage: 'Tu es un expert extraction données factures françaises. Réponds uniquement avec JSON strict.',
};

export const expenseReportConfig: DocumentConfig<typeof expenseReportSchema> = {
  type: 'expense-report',
  schema: expenseReportSchema,
  prompt: getExpenseReportPrompt,
  systemMessage: 'Tu es un expert extraction données notes de frais. Réponds uniquement avec JSON strict.',
};

export const receiptConfig: DocumentConfig<typeof receiptSchema> = {
  type: 'receipt',
  schema: receiptSchema,
  prompt: getReceiptPrompt,
  systemMessage: 'Tu es un expert extraction données tickets de caisse. Réponds uniquement avec JSON strict.',
};

// ============================================================================
// REGISTRY GLOBAL
// ============================================================================

export const DOCUMENT_CONFIGS: Record<DocumentType, DocumentConfig> = {
  'inbound-invoice': inboundInvoiceConfig,
  'expense-report': expenseReportConfig,
  'receipt': receiptConfig,
};

/**
 * Helper pour récupérer la config d'un type de document
 */
export function getDocumentConfig(type: DocumentType): DocumentConfig {
  const config = DOCUMENT_CONFIGS[type];
  if (!config) {
    throw new Error(`Unknown document type: ${type}`);
  }
  return config;
}