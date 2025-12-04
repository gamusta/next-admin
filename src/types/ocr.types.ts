import { z } from 'zod';

// ============================================================================
// RAW OCR DATA (PaddleOCR output)
// ============================================================================

/**
 * Structure d'un texte détecté par PaddleOCR
 */
export interface PaddleOCRText {
  text: string;
  confidence: number;
  bbox: [[number, number], [number, number], [number, number], [number, number]]; // 4 coins rectangle
}

/**
 * Réponse complète du service PaddleOCR
 */
export interface PaddleOCRRawData {
  texts: PaddleOCRText[];
  avg_confidence?: number;
}

// ============================================================================
// EXTRACTED OCR DATA (après structuration)
// ============================================================================

/**
 * @deprecated Use InboundInvoiceData from document-configs instead
 * Schema Zod pour les données OCR extraites (factures)
 */
export const ocrDataSchema = z.object({
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
  issueDate: z.string().nullable(), // Format ISO ou DD/MM/YYYY
  dueDate: z.string().nullable().optional(),
  subtotal: z.number().nullable(),
  taxAmount: z.number().nullable(),
  totalAmount: z.number().nullable(),
  currency: z.string().nullable().optional(),
  confidence: z.enum(['high', 'medium', 'low']).nullable().optional(),
});

export type OCRData = z.infer<typeof ocrDataSchema>;

// Types pour input fichier
export interface FileInput {
  fileBase64: string;
  fileName: string;
  fileType: string;
}

// Résultat de l'extraction OCR
export interface OCRResult {
  success: boolean;
  data?: OCRData | unknown; // OCRData deprecated, use document-specific types
  error?: string;
  extractorUsed?: string; // Nom de l'extracteur utilisé
  rawOcrData?: PaddleOCRRawData; // Données brutes OCR (bbox, confidence) pour cache/réutilisation
}

// Interface générique pour un extracteur
export interface IOCRExtractor {
  name: string;
  extract(input: FileInput): Promise<OCRResult>;
  isAvailable(): Promise<boolean>;
}

// Types d'extracteurs supportés
export type ExtractorType = 'claude' | 'paddle-ocr' | 'paddle-ocr-service' | 'openai';

// Configuration extracteur
export interface ExtractorConfig {
  type: ExtractorType;
  priority: number; // Plus bas = plus prioritaire
  enabled: boolean;
}
