import Anthropic from '@anthropic-ai/sdk';
import type { IOCRExtractor, FileInput, OCRResult, OCRData } from '@/types/ocr.types';
import { ocrDataSchema } from '@/types/ocr.types';

/**
 * Extracteur OCR utilisant Claude API (Anthropic)
 * Vision + extraction de données structurées
 */
export class ClaudeExtractor implements IOCRExtractor {
  name = 'claude';
  private client: Anthropic | null = null;

  private getClient(): Anthropic | null {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return null;
    }

    if (!this.client) {
      this.client = new Anthropic({ apiKey });
    }

    return this.client;
  }

  async isAvailable(): Promise<boolean> {
    return !!process.env.ANTHROPIC_API_KEY;
  }

  async extract(input: FileInput): Promise<OCRResult> {
    try {
      const client = this.getClient();
      if (!client) {
        return {
          success: false,
          error: 'ANTHROPIC_API_KEY non configurée',
        };
      }

      // Vérif type fichier
      if (input.fileType === 'application/pdf') {
        return {
          success: false,
          error: 'PDFs non supportés. Utiliser JPG/PNG ou PaddleOCR pour PDFs',
        };
      }

      // Extraire base64 pur
      const base64Data = input.fileBase64.includes('base64,')
        ? input.fileBase64.split('base64,')[1]
        : input.fileBase64;

      // Déterminer media_type
      let mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' = 'image/jpeg';
      if (input.fileType === 'image/png') {
        mediaType = 'image/png';
      } else if (input.fileType === 'image/webp') {
        mediaType = 'image/webp';
      } else if (input.fileType === 'image/gif') {
        mediaType = 'image/gif';
      }

      const message = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: base64Data,
                },
              },
              {
                type: 'text',
                text: this.getExtractionPrompt(),
              },
            ],
          },
        ],
      });

      // Extraire texte
      const responseText = message.content[0]?.type === 'text'
        ? message.content[0].text
        : '';

      if (!responseText) {
        return {
          success: false,
          error: 'Aucune réponse reçue de Claude API',
        };
      }

      // Parser JSON
      const cleanJson = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const parsedData = JSON.parse(cleanJson);

      // Valider avec Zod
      const validatedData = ocrDataSchema.parse(parsedData);

      return {
        success: true,
        data: validatedData,
        extractorUsed: this.name,
      };
    } catch (error) {
      console.error('ClaudeExtractor error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur extraction Claude',
      };
    }
  }

  private getExtractionPrompt(): string {
    return `Analyse cette facture d'achat et extrait les informations suivantes au format JSON strict (sans markdown, juste le JSON brut) :

{
  "supplierName": "Nom du fournisseur",
  "supplierSiret": "Numéro SIRET si présent",
  "supplierAddress": "Adresse complète du fournisseur",
  "supplierCity": "Ville du fournisseur",
  "supplierPostalCode": "Code postal du fournisseur",
  "supplierPhone": "Téléphone du fournisseur",
  "supplierEmail": "Email du fournisseur",
  "supplierBankName": "Nom banque du fournisseur",
  "supplierBic": "BIC du fournisseur",
  "supplierIban": "IBAN du fournisseur",
  "invoiceNumber": "Numéro de facture",
  "issueDate": "Date de facturation au format YYYY-MM-DD",
  "dueDate": "Date d'échéance au format YYYY-MM-DD (si présente)",
  "subtotal": montant HT en nombre,
  "taxAmount": montant TVA en nombre,
  "totalAmount": montant TTC en nombre,
  "currency": "EUR ou autre devise",
  "confidence": "high|medium|low"
}

IMPORTANT:
- Réponds UNIQUEMENT avec le JSON, sans texte avant ou après
- Les montants doivent être des nombres (pas de strings)
- Les dates doivent être au format YYYY-MM-DD
- Si une information est manquante, utilise null
- Champ "confidence" : évalue ta confiance globale sur l'extraction
  - "high" : facture claire, toutes infos critiques lisibles
  - "medium" : facture acceptable, quelques zones floues
  - "low" : facture difficile, beaucoup d'incertitudes`;
  }
}