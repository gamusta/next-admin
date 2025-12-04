import { Client } from '@gradio/client';
import Anthropic from '@anthropic-ai/sdk';
import type { IOCRExtractor, FileInput, OCRResult } from '@/types/ocr.types';
import { ocrDataSchema } from '@/types/ocr.types';

/**
 * Extracteur OCR utilisant PaddleOCR (HuggingFace) + LLM pour structuration
 * 2 étapes:
 * 1. PaddleOCR extrait le texte brut
 * 2. LLM (Claude ou ChatGPT) structure en JSON
 */
export class PaddleOCRExtractor implements IOCRExtractor {
  name = 'paddle-ocr';

  async isAvailable(): Promise<boolean> {
    // Vérifier qu'on a au moins 1 LLM dispo pour structuration
    return !!(
      process.env.ANTHROPIC_API_KEY ||
      process.env.OPENAI_API_KEY
    );
  }

  async extract(input: FileInput): Promise<OCRResult> {
    try {
      // Étape 1: Extraction texte via PaddleOCR
      const extractedText = await this.extractTextWithPaddle(input);
      if (!extractedText) {
        return {
          success: false,
          error: 'Aucun texte extrait par PaddleOCR',
        };
      }

      // Étape 2: Structuration avec LLM
      const structuredData = await this.structureWithLLM(extractedText);
      if (!structuredData) {
        return {
          success: false,
          error: 'Échec structuration données',
        };
      }

      return {
        success: true,
        data: structuredData,
        extractorUsed: this.name,
      };
    } catch (error) {
      console.error('PaddleOCRExtractor error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur extraction PaddleOCR',
      };
    }
  }

  /**
   * Étape 1: Extraction texte brut avec PaddleOCR via HuggingFace
   */
  private async extractTextWithPaddle(input: FileInput): Promise<string | null> {
    try {
      // HuggingFace Space pour PaddleOCR
      const spaceUrl = process.env.HUGGINGFACE_PADDLE_SPACE || 'PaddlePaddle/PaddleOCR';

      const client = await Client.connect(spaceUrl);

      // Convertir base64 en Blob pour Gradio
      const base64Data = input.fileBase64.includes('base64,')
        ? input.fileBase64.split('base64,')[1]
        : input.fileBase64;

      const buffer = Buffer.from(base64Data, 'base64');
      const blob = new Blob([buffer], { type: input.fileType });

      // Appel PaddleOCR
      const result = await client.predict('/run_ocr', {
        image: blob,
      });

      // Résultat structure dépend du Space, adapter selon API réelle
      // Format attendu: { data: [text_string] } ou similar
      const data = result?.data as any;

      if (!data || typeof data !== 'object') {
        return null;
      }

      // Extraire texte (adapter selon structure réelle du Space)
      let extractedText = '';
      if (Array.isArray(data)) {
        extractedText = data.join('\n');
      } else if (data.text) {
        extractedText = data.text;
      } else if (data[0]) {
        extractedText = data[0];
      }

      return extractedText || null;
    } catch (error) {
      console.error('PaddleOCR extraction error:', error);
      throw error;
    }
  }

  /**
   * Étape 2: Structuration du texte brut en JSON via LLM
   * Essaye Claude d'abord, puis OpenAI si indispo
   */
  private async structureWithLLM(text: string): Promise<any> {
    // Priorité: Claude > OpenAI
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        return await this.structureWithClaude(text);
      } catch (error) {
        console.warn('Claude structuring failed, trying OpenAI:', error);
      }
    }

    if (process.env.OPENAI_API_KEY) {
      return await this.structureWithOpenAI(text);
    }

    throw new Error('Aucun LLM disponible pour structuration');
  }

  private async structureWithClaude(text: string): Promise<any> {
    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: this.getStructuringPrompt(text),
        },
      ],
    });

    const responseText = message.content[0]?.type === 'text'
      ? message.content[0].text
      : '';

    if (!responseText) {
      throw new Error('Pas de réponse Claude');
    }

    // Parser JSON
    const cleanJson = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const parsedData = JSON.parse(cleanJson);
    return ocrDataSchema.parse(parsedData);
  }

  private async structureWithOpenAI(text: string): Promise<any> {
    // TODO: Implémenter avec OpenAI SDK
    // import OpenAI from 'openai';
    // const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    // ...
    throw new Error('OpenAI structuring pas encore implémenté');
  }

  private getStructuringPrompt(extractedText: string): string {
    return `Voici le texte brut extrait d'une facture d'achat par OCR :

${extractedText}

Ta tâche : analyser ce texte et extraire les informations au format JSON strict (sans markdown) :

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
- Champ "confidence" : évalue ta confiance sur l'extraction depuis ce texte OCR
  - "high" : texte clair, toutes infos critiques présentes
  - "medium" : texte acceptable, quelques zones floues
  - "low" : texte difficile, beaucoup d'incertitudes`;
  }
}
