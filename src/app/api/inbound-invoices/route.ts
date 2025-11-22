import Anthropic from '@anthropic-ai/sdk';
import sharp from 'sharp';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get('file') as File;

  // Limite 10MB
  if (file.size > 10 * 1024 * 1024) {
    return Response.json({ error: 'Fichier > 10MB' }, { status: 400 });
  }

  let buffer = Buffer.from(await file.arrayBuffer());

  // Si > 2MB, compresser automatiquement
  if (file.size > 2 * 1024 * 1024) {
    buffer = Buffer.from(await sharp(buffer)
      .resize(2000, 2000, { // Max 2000px côté le plus long
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 85 }) // Compression JPEG
      .toBuffer());

    console.log(`Optimisé: ${file.size} → ${buffer.length} bytes`);
  }

  // Pré-processing image
  const processed = await sharp(buffer)
    .rotate()
    .greyscale()
    .normalize()
    .toBuffer();

  // Claude Vision pour OCR + extraction
  const base64Image = processed.toString('base64');

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: [{
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/jpeg',
          data: base64Image,
        }
      }, {
        type: 'text',
        text: `Extrait les données structurées de cette facture fournisseur.

Retourne UNIQUEMENT un JSON valide (pas de markdown) :
{
  "supplierName": "string",
  "supplierSiren": "string ou null",
  "supplierEmail": "string",
  "supplierPhone": "string",
  "supplierAddress": "string",
  "SupplierBankBic": "string",
  "SupplierBankName": "string",
  "SuppplierIban": "string",
  "invoiceNumber": "string",
  "dateEmission": "YYYY-MM-DD",
  "dateEcheance": "YYYY-MM-DD",
  "totalHT": number,
  "tvaRate": number,
  "totalTVA": number,
  "totalTTC": number,
  "confidence": "high" | "medium" | "low"
}

Si une donnée n'est pas trouvée, mets null.`
      }]
    }]
  });

  const textBlock = message.content.find(block => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    return Response.json({ error: 'Pas de texte dans réponse Claude' }, { status: 500 });
  }

  const extracted = JSON.parse(textBlock.text);

  return Response.json(extracted);
}
