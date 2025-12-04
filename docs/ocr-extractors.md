# Système OCR Modulaire

## 📖 Vue d'ensemble

Système d'extraction OCR modulaire avec fallback automatique pour analyser les factures d'achat.

**Fonctionnalités :**
- ✅ Plusieurs extracteurs supportés (Claude, PaddleOCR + LLM)
- ✅ Fallback automatique si extracteur indisponible
- ✅ Extraction données structurées au format JSON
- ✅ Configurable via variables d'environnement
- ✅ Extensible (facile d'ajouter nouveaux extracteurs)

---

## 🏗️ Architecture

```
src/lib/ocr/
├── ocr-orchestrator.ts          # Orchestrateur avec fallback
└── extractors/
    ├── claude-extractor.ts      # Claude API (Vision)
    └── paddle-ocr-extractor.ts  # PaddleOCR + LLM

src/types/
└── ocr.types.ts                 # Types et interfaces

src/actions/
└── inbound-invoices.actions.ts  # Utilise orchestrateur
```

---

## 🔧 Extracteurs disponibles

### 1. Claude Extractor (Priorité 1)
**Type :** Vision directe (1 étape)

**Fonctionnement :**
- Envoie image à Claude API
- Claude analyse visuellement et extrait JSON structuré

**Avantages :**
- 🚀 Rapide (1 seul appel API)
- 🎯 Haute précision sur documents clairs
- 📄 Supporte images (JPG, PNG, WebP)

**Limitations :**
- ❌ PDFs non supportés directement
- 💰 Coût par image analysée
- 🔑 Requiert `ANTHROPIC_API_KEY`

**Config requise :**
```env
ANTHROPIC_API_KEY=sk-ant-api03-...
```

---

### 2. PaddleOCR Extractor (Priorité 2)
**Type :** OCR + LLM (2 étapes)

**Fonctionnement :**
1. PaddleOCR (HuggingFace) extrait texte brut
2. LLM (Claude ou OpenAI) structure en JSON

**Avantages :**
- 📄 Supporte PDFs et images
- 🆓 PaddleOCR gratuit (HuggingFace Space)
- 🔄 Fallback LLM (Claude → OpenAI)

**Limitations :**
- 🐌 Plus lent (2 appels API)
- 🎯 Précision dépend qualité OCR
- 🔑 Requiert LLM pour structuration

**Config requise :**
```env
# PaddleOCR HuggingFace Space (optionnel, défaut: PaddlePaddle/PaddleOCR)
HUGGINGFACE_PADDLE_SPACE=PaddlePaddle/PaddleOCR

# LLM pour structuration (au moins 1)
ANTHROPIC_API_KEY=sk-ant-api03-...  # OU
OPENAI_API_KEY=sk-...
```

---

## 🚀 Utilisation

### Extraction automatique (avec fallback)
```typescript
import { analyzeInvoiceWithOCR } from '@/actions/inbound-invoices.actions';

const result = await analyzeInvoiceWithOCR({
  fileBase64: 'data:image/jpeg;base64,...',
  fileName: 'facture.jpg',
  fileType: 'image/jpeg',
});

if (result.success) {
  console.log('Extracteur utilisé:', result.extractorUsed);
  console.log('Données:', result.data);
} else {
  console.error('Erreur:', result.error);
}
```

### Extraction avec extracteur spécifique
```typescript
import { analyzeInvoiceWithExtractor } from '@/actions/inbound-invoices.actions';

const result = await analyzeInvoiceWithExtractor(
  {
    fileBase64: '...',
    fileName: 'facture.jpg',
    fileType: 'image/jpeg',
  },
  'paddle-ocr' // Forcer PaddleOCR
);
```

### Lister extracteurs disponibles
```typescript
import { getAvailableExtractors } from '@/actions/inbound-invoices.actions';

const extractors = await getAvailableExtractors();
// ['claude', 'paddle-ocr']
```

---

## 🎯 Format de sortie

Tous les extracteurs retournent le même format JSON :

```typescript
{
  success: boolean;
  data?: {
    supplierName: string | null;
    supplierSiret: string | null;
    supplierAddress: string | null;
    supplierCity: string | null;
    supplierPostalCode: string | null;
    supplierPhone: string | null;
    supplierEmail: string | null;
    supplierBankName: string | null;
    supplierBic: string | null;
    supplierIban: string | null;
    invoiceNumber: string | null;
    issueDate: string | null; // YYYY-MM-DD
    dueDate: string | null; // YYYY-MM-DD
    subtotal: number | null;
    taxAmount: number | null;
    totalAmount: number | null;
    currency: string | null;
    confidence: 'high' | 'medium' | 'low' | null;
  };
  error?: string;
  extractorUsed?: string;
}
```

---

## ⚙️ Configuration orchestrateur

### Modifier priorités et activations
```typescript
import { getOCROrchestrator } from '@/lib/ocr/ocr-orchestrator';

const orchestrator = getOCROrchestrator();

orchestrator.configure([
  { type: 'paddle-ocr', priority: 1, enabled: true },  // Prioritaire
  { type: 'claude', priority: 2, enabled: true },      // Fallback
]);
```

### Désactiver extracteur
```typescript
orchestrator.configure([
  { type: 'claude', priority: 1, enabled: false }, // Désactivé
  { type: 'paddle-ocr', priority: 2, enabled: true },
]);
```

---

## 🛠️ Ajouter nouvel extracteur

### 1. Créer classe extracteur
```typescript
// src/lib/ocr/extractors/mon-extractor.ts
import type { IOCRExtractor, FileInput, OCRResult } from '@/types/ocr.types';
import { ocrDataSchema } from '@/types/ocr.types';

export class MonExtractor implements IOCRExtractor {
  name = 'mon-extractor';

  async isAvailable(): Promise<boolean> {
    return !!process.env.MON_API_KEY;
  }

  async extract(input: FileInput): Promise<OCRResult> {
    try {
      // ... logique extraction ...

      const data = await extractData(input);
      const validated = ocrDataSchema.parse(data);

      return {
        success: true,
        data: validated,
        extractorUsed: this.name,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur',
      };
    }
  }
}
```

### 2. Enregistrer dans orchestrateur
```typescript
// src/lib/ocr/ocr-orchestrator.ts
import { MonExtractor } from './extractors/mon-extractor';

constructor() {
  this.registerExtractor(new ClaudeExtractor());
  this.registerExtractor(new PaddleOCRExtractor());
  this.registerExtractor(new MonExtractor()); // ✅ Ajout

  this.config = [
    { type: 'claude', priority: 1, enabled: true },
    { type: 'mon-extractor', priority: 2, enabled: true }, // ✅ Config
    { type: 'paddle-ocr', priority: 3, enabled: true },
  ];
}
```

### 3. Ajouter type
```typescript
// src/types/ocr.types.ts
export type ExtractorType = 'claude' | 'paddle-ocr' | 'mon-extractor'; // ✅
```

---

## 🔍 Logs et debug

L'orchestrateur log automatiquement :
```
Tentative extraction avec claude...
✓ Extraction réussie avec claude
```

En cas d'échec :
```
Tentative extraction avec claude...
claude: ANTHROPIC_API_KEY non configurée
Tentative extraction avec paddle-ocr...
✓ Extraction réussie avec paddle-ocr
```

---

## 📊 Comparaison extracteurs

| Critère | Claude | PaddleOCR |
|---------|--------|-----------|
| Vitesse | ⚡⚡⚡ Rapide | ⚡⚡ Moyen |
| Précision | 🎯🎯🎯 Excellente | 🎯🎯 Bonne |
| PDFs | ❌ Non | ✅ Oui |
| Images | ✅ Oui | ✅ Oui |
| Coût | 💰 Payant | 🆓 Gratuit (OCR) + 💰 LLM |
| Config | Simple | Moyenne |

---

## ✅ Checklist déploiement

- [ ] Variables env configurées (au moins 1 extracteur)
- [ ] Tester extracteur principal
- [ ] Tester fallback (désactiver principal)
- [ ] Vérifier logs orchestrateur
- [ ] Tester formats fichiers (JPG, PNG, PDF)
- [ ] Documenter config production

---

## 🚨 Troubleshooting

### "Tous les extracteurs ont échoué"
- ✅ Vérifier variables env
- ✅ Tester `getAvailableExtractors()`
- ✅ Vérifier logs console

### "claude: indisponible"
- ✅ `ANTHROPIC_API_KEY` configurée ?
- ✅ Clé valide ?

### "paddle-ocr: Aucun LLM disponible"
- ✅ `ANTHROPIC_API_KEY` ou `OPENAI_API_KEY` ?

### PaddleOCR lent
- ✅ HuggingFace Space peut être cold start
- ✅ Considérer self-hosting Space

---

## 📚 Références

- **Claude API :** https://docs.anthropic.com/claude/reference/messages-vision
- **PaddleOCR :** https://github.com/PaddlePaddle/PaddleOCR
- **Gradio Client :** https://www.gradio.app/docs/python-client/introduction
- **HuggingFace Spaces :** https://huggingface.co/spaces

---

**Note :** Système conçu pour être extensible. Ajouter nouveaux extracteurs = implémenter `IOCRExtractor` + enregistrer dans orchestrateur.
