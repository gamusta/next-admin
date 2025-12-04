import type { IOCRExtractor, FileInput, OCRResult, ExtractorConfig } from '@/types/ocr.types';
import type { DocumentType } from './extractors/document-configs';
import { ClaudeExtractor } from './extractors/claude-extractor';
import { PaddleOCRExtractor } from './extractors/paddle-ocr-extractor';
import { PaddleOCRServiceExtractor } from './extractors/paddle-ocr-service-extractor';

/**
 * Orchestrateur OCR avec fallback automatique
 * Tente extracteurs par priorité jusqu'à succès
 * Supporte différents types de documents (factures, notes de frais, etc)
 */
export class OCROrchestrator {
  private extractors: Map<string, IOCRExtractor> = new Map();
  private config: ExtractorConfig[] = [];
  private documentType: DocumentType;

  constructor(documentType: DocumentType = 'inbound-invoice') {
    this.documentType = documentType;

    // Register extracteurs
    this.registerExtractor(new ClaudeExtractor());
    this.registerExtractor(new PaddleOCRExtractor());
    this.registerExtractor(new PaddleOCRServiceExtractor(documentType));

    // Config par défaut (ordre priorité)
    this.config = [
      { type: 'paddle-ocr-service', priority: 1, enabled: true },
      { type: 'claude', priority: 2, enabled: false },
      { type: 'paddle-ocr', priority: 3, enabled: false },
    ];
  }

  /**
   * Enregistrer extracteur
   */
  private registerExtractor(extractor: IOCRExtractor): void {
    this.extractors.set(extractor.name, extractor);
  }

  /**
   * Configurer extracteurs et priorités
   */
  public configure(config: ExtractorConfig[]): void {
    this.config = config.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Extraction avec fallback automatique
   * Tente chaque extracteur par priorité jusqu'à succès
   */
  public async extract(input: FileInput): Promise<OCRResult> {
    const errors: string[] = [];

    // Filtrer extracteurs actifs triés par priorité
    const activeConfigs = this.config
      .filter((c) => c.enabled)
      .sort((a, b) => a.priority - b.priority);

    if (activeConfigs.length === 0) {
      return {
        success: false,
        error: 'Aucun extracteur activé',
      };
    }

    // Tenter chaque extracteur
    for (const config of activeConfigs) {
      const extractor = this.extractors.get(config.type);

      if (!extractor) {
        errors.push(`Extracteur ${config.type} non trouvé`);
        continue;
      }

      // Vérifier dispo
      const isAvailable = await extractor.isAvailable();
      if (!isAvailable) {
        errors.push(`${extractor.name}: indisponible (config manquante)`);
        continue;
      }

      // Tenter extraction
      try {
        console.log(`Tentative extraction avec ${extractor.name}...`);
        const result = await extractor.extract(input);

        if (result.success) {
          console.log(`✓ Extraction réussie avec ${extractor.name}`);
          return result;
        }

        errors.push(`${extractor.name}: ${result.error || 'échec'}`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'erreur inconnue';
        errors.push(`${extractor.name}: ${errorMsg}`);
        console.error(`Extracteur ${extractor.name} error:`, error);
      }
    }

    // Tous ont échoué
    return {
      success: false,
      error: `Tous les extracteurs ont échoué:\n${errors.join('\n')}`,
    };
  }

  /**
   * Extraire avec extracteur spécifique (pas de fallback)
   */
  public async extractWith(extractorName: string, input: FileInput): Promise<OCRResult> {
    const extractor = this.extractors.get(extractorName);

    if (!extractor) {
      return {
        success: false,
        error: `Extracteur ${extractorName} non trouvé`,
      };
    }

    const isAvailable = await extractor.isAvailable();
    if (!isAvailable) {
      return {
        success: false,
        error: `Extracteur ${extractorName} indisponible`,
      };
    }

    return await extractor.extract(input);
  }

  /**
   * Lister extracteurs disponibles
   */
  public async getAvailableExtractors(): Promise<string[]> {
    const available: string[] = [];

    for (const [name, extractor] of this.extractors) {
      const isAvailable = await extractor.isAvailable();
      if (isAvailable) {
        available.push(name);
      }
    }

    return available;
  }
}

/**
 * Factory pour créer orchestrateur par type de document
 */
export function getOCROrchestrator(documentType: DocumentType = 'inbound-invoice'): OCROrchestrator {
  return new OCROrchestrator(documentType);
}
