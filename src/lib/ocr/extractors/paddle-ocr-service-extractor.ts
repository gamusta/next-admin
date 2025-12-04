import OpenAI from 'openai';
import type { IOCRExtractor, FileInput, OCRResult } from '@/types/ocr.types';
import type { DocumentType, DocumentConfig } from './document-configs';
import { getDocumentConfig } from './document-configs';

/**
 * Extracteur générique utilisant service PaddleOCR distant + OpenAI
 * 1. Service PaddleOCR → texte brut
 * 2. OpenAI → extraction structurée selon type de document
 *
 * Supporte: factures achat, notes de frais, tickets de caisse, etc.
 */
export class PaddleOCRServiceExtractor implements IOCRExtractor {
  name = 'paddle-ocr-service';
  private openaiClient: OpenAI | null = null;
  private documentType: DocumentType;
  private config: DocumentConfig;

  constructor(documentType: DocumentType = 'inbound-invoice') {
    this.documentType = documentType;
    this.config = getDocumentConfig(documentType);
  }

  private getOpenAIClient(): OpenAI | null {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return null;

    if (!this.openaiClient) {
      this.openaiClient = new OpenAI({ apiKey });
    }
    return this.openaiClient;
  }

  async isAvailable(): Promise<boolean> {
    return !!(
      process.env.PADDLE_OCR_SERVICE_URL &&
      process.env.PADDLE_OCR_API_KEY &&
      process.env.OPENAI_API_KEY
    );
  }

  async extract(input: FileInput): Promise<OCRResult> {
    try {
      const serviceUrl = process.env.PADDLE_OCR_SERVICE_URL;
      const apiKey = process.env.PADDLE_OCR_API_KEY;
      const openai = this.getOpenAIClient();

      if (!serviceUrl || !apiKey || !openai) {
        return {
          success: false,
          error: 'Config manquante (PADDLE_OCR_SERVICE_URL, PADDLE_OCR_API_KEY, OPENAI_API_KEY)',
        };
      }

      // 1. Appel service OCR pour texte brut
      const formData = new FormData();

      const base64Data = input.fileBase64.includes('base64,')
        ? input.fileBase64.split('base64,')[1]
        : input.fileBase64;

      const blob = this.base64ToBlob(base64Data, input.fileType);
      formData.append('file', blob, input.fileName);

      const ocrResponse = await fetch(`${serviceUrl}/ocr`, {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey,
        },
        body: formData,
      });

      if (!ocrResponse.ok) {
        return {
          success: false,
          error: `Service OCR error: ${ocrResponse.statusText}`,
        };
      }

      const ocrData = await ocrResponse.json();

      if (!ocrData.texts || ocrData.texts.length === 0) {
        return {
          success: false,
          error: 'Aucun texte détecté',
        };
      }

      // 2. Structuration via OpenAI
      const fullText = ocrData.texts.map((t: any) => t.text).join('\n');
      const avgConfidence = ocrData.avg_confidence || 0;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0,
        messages: [
          {
            role: 'system',
            content: this.config.systemMessage || 'Tu es un expert extraction données. Réponds uniquement avec JSON strict.',
          },
          {
            role: 'user',
            content: this.config.prompt(fullText),
          },
        ],
      });

      const responseText = completion.choices[0]?.message?.content || '';
      if (!responseText) {
        return {
          success: false,
          error: 'Aucune réponse OpenAI',
        };
      }

      // Parse JSON
      const cleanJson = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const parsedData = JSON.parse(cleanJson);

      // Adjust confidence basé sur qualité OCR
      if (parsedData.confidence === 'high' && avgConfidence < 0.75) {
        parsedData.confidence = 'medium';
      }

      const validatedData = this.config.schema.parse(parsedData);

      return {
        success: true,
        data: validatedData,
        extractorUsed: this.name,
        rawOcrData: ocrData, // Stockage données OCR brutes (avec bbox, confidence)
      };
    } catch (error) {
      console.error('PaddleOCRServiceExtractor error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur extraction',
      };
    }
  }

  private base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

}