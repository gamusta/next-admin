# Refactorisation OCR - Résumé

## 🎯 Objectif
Système OCR modulaire avec fallback automatique pour analyser factures d'achat.

## 📦 Fichiers créés

### Types et interfaces
- `src/types/ocr.types.ts` - Types, schemas Zod, interfaces extracteurs

### Extracteurs
- `src/lib/ocr/extractors/claude-extractor.ts` - Claude Vision API
- `src/lib/ocr/extractors/paddle-ocr-extractor.ts` - PaddleOCR + LLM

### Orchestrateur
- `src/lib/ocr/ocr-orchestrator.ts` - Gestion fallback, priorités

### Documentation
- `docs/ocr-extractors.md` - Guide complet utilisation

### Configuration
- `.env.example` - Variables env extracteurs

## 🔄 Modifications

### `src/actions/inbound-invoices.actions.ts`
- ✅ Supprimé code OCR direct (150 lignes)
- ✅ Ajouté `analyzeInvoiceWithOCR()` via orchestrateur
- ✅ Ajouté `analyzeInvoiceWithExtractor()` (forcer extracteur)
- ✅ Ajouté `getAvailableExtractors()` (liste extracteurs dispo)

## 🚀 Installation

### 1. Installer dépendances
```bash
npm install @gradio/client
# openai SDK si besoin OpenAI fallback
npm install openai
```

### 2. Config variables env
```env
# Au moins 1 requis
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
HUGGINGFACE_PADDLE_SPACE=PaddlePaddle/PaddleOCR
```

### 3. Tester
```typescript
import { analyzeInvoiceWithOCR } from '@/actions/inbound-invoices.actions';

const result = await analyzeInvoiceWithOCR({
  fileBase64: '...',
  fileName: 'facture.jpg',
  fileType: 'image/jpeg',
});
```

## 🎯 Comportement fallback

1. Tente **Claude** (priorité 1)
   - Si dispo → extraction
   - Sinon → next

2. Tente **PaddleOCR** (priorité 2)
   - OCR texte → structuration LLM
   - Si dispo → extraction
   - Sinon → erreur

## ✅ Avantages

- ✅ Code `inbound-invoices.actions.ts` allégé (-150 lignes)
- ✅ Fallback automatique (résilience)
- ✅ Extensible (ajouter extracteurs facilement)
- ✅ Réutilisable (pas exclusif factures)
- ✅ Config flexible (priorités, activation)

## 📋 TODO

- [ ] Installer `@gradio/client`
- [ ] Implémenter `structureWithOpenAI()` dans PaddleOCRExtractor
- [ ] Tester extracteurs en local
- [ ] Vérifier Space HuggingFace PaddleOCR (endpoint `/run_ocr`)
- [ ] Ajuster parsing résultat PaddleOCR selon API Space réelle
- [ ] Ajouter logs/métriques extracteurs
- [ ] Tests unitaires extracteurs

## ⚠️ Notes

### PaddleOCR API
API HuggingFace Space peut varier. Vérifier :
- Endpoint exact (`/run_ocr` ou autre)
- Format input (Blob, base64, etc.)
- Format output (structure JSON)

Adapter `extractTextWithPaddle()` selon API réelle.

### OpenAI
`structureWithOpenAI()` à implémenter si fallback OpenAI souhaité.

## 📚 Références

- Guide complet : `docs/ocr-extractors.md`
- Types : `src/types/ocr.types.ts`
- Orchestrateur : `src/lib/ocr/ocr-orchestrator.ts`
