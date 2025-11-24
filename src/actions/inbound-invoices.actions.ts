'use server';

import { db } from '@/lib/db/drizzle';
import { inboundInvoices, suppliers, inboundInvoiceComments } from '@/lib/db/schema';
import { getTenantContext } from '@/lib/tenant';
import { uploadInvoiceFile } from '@/lib/storage';
import { eq, desc, and } from 'drizzle-orm';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import type {
  CreateInboundInvoiceInput,
  CreateCommentInput,
} from '@/types/inbound-invoices.types';

export async function getInboundInvoices() {
  const { companyId } = await getTenantContext();

  const result = await db
    .select({
      id: inboundInvoices.id,
      number: inboundInvoices.number,
      issueDate: inboundInvoices.issueDate,
      dueDate: inboundInvoices.dueDate,
      subtotal: inboundInvoices.subtotal,
      taxAmount: inboundInvoices.taxAmount,
      totalAmount: inboundInvoices.totalAmount,
      status: inboundInvoices.status,
      supplierName: suppliers.businessName,
      supplierNameExtracted: inboundInvoices.supplierNameExtracted,
      supplierId: inboundInvoices.supplierId,
    })
    .from(inboundInvoices)
    .leftJoin(suppliers, eq(inboundInvoices.supplierId, suppliers.id))
    .where(eq(inboundInvoices.companyId, companyId))
    .orderBy(desc(inboundInvoices.issueDate));

  // Formater dates server-side pour performance (1x par invoice vs Nx par render)
  return result.map((invoice) => ({
    ...invoice,
    supplierName: invoice.supplierName || invoice.supplierNameExtracted || 'À définir',
    issueDateFormatted: format(invoice.issueDate, 'dd/MM/yyyy', { locale: fr }),
    dueDateFormatted: format(invoice.dueDate, 'dd/MM/yyyy', { locale: fr }),
    // Garder dates ISO pour filtres
    issueDate: invoice.issueDate.toISOString(),
    dueDate: invoice.dueDate.toISOString(),
  }));
}

// Récupérer une facture par ID
export async function getInboundInvoiceById(invoiceId: string) {
  const { companyId } = await getTenantContext();

  const [invoice] = await db
    .select({
      id: inboundInvoices.id,
      number: inboundInvoices.number,
      issueDate: inboundInvoices.issueDate,
      dueDate: inboundInvoices.dueDate,
      subtotal: inboundInvoices.subtotal,
      taxAmount: inboundInvoices.taxAmount,
      totalAmount: inboundInvoices.totalAmount,
      status: inboundInvoices.status,
      notes: inboundInvoices.notes,
      fileUrl: inboundInvoices.fileUrl,
      ocrData: inboundInvoices.ocrData,
      supplierId: inboundInvoices.supplierId,
      supplierName: suppliers.businessName,
    })
    .from(inboundInvoices)
    .leftJoin(suppliers, eq(inboundInvoices.supplierId, suppliers.id))
    .where(
      and(
        eq(inboundInvoices.id, invoiceId),
        eq(inboundInvoices.companyId, companyId)
      )
    );

  if (!invoice) {
    throw new Error('Facture introuvable');
  }

  return invoice;
}

// Schema Zod pour les données OCR extraites
const ocrDataSchema = z.object({
  supplierName: z.string(),
  supplierSiret: z.string().optional(),
  supplierAddress: z.string().optional(),
  supplierCity: z.string().optional(),
  supplierPostalCode: z.string().optional(),
  supplierPhone: z.string().optional(),
  supplierEmail: z.string().optional(),
  supplierBankName: z.string().optional(),
  supplierBic: z.string().optional(),
  supplierIban: z.string().optional(),
  invoiceNumber: z.string(),
  issueDate: z.string(), // Format ISO ou DD/MM/YYYY
  dueDate: z.string().optional(),
  subtotal: z.number(),
  taxAmount: z.number(),
  totalAmount: z.number(),
  currency: z.string().default('EUR'),
});

type OCRData = z.infer<typeof ocrDataSchema>;

// Fonction pour analyser une facture avec OCR Anthropic
export async function analyzeInvoiceWithOCR(input: {
  fileBase64: string;
  fileName: string;
  fileType: string;
}): Promise<{ success: boolean; data?: OCRData; error?: string }> {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        error: 'ANTHROPIC_API_KEY non configurée',
      };
    }

    const anthropic = new Anthropic({
      apiKey,
    });

    // Extraire le base64 pur (sans le préfixe data:...)
    const base64Data = input.fileBase64.includes('base64,')
      ? input.fileBase64.split('base64,')[1]
      : input.fileBase64;

    // Déterminer le media_type
    let mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' = 'image/jpeg';
    if (input.fileType === 'image/png') {
      mediaType = 'image/png';
    } else if (input.fileType === 'application/pdf') {
      // Note: Anthropic API ne supporte pas directement les PDFs
      // Il faudrait convertir le PDF en images d'abord
      // Pour l'instant, on retourne une erreur
      return {
        success: false,
        error: 'Les fichiers PDF doivent être convertis en images. Veuillez utiliser une image JPG ou PNG.',
      };
    }

    const message = await anthropic.messages.create({
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
              text: `Analyse cette facture d'achat et extrait les informations suivantes au format JSON strict (sans markdown, juste le JSON brut) :

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
  "currency": "EUR"
}

IMPORTANT:
- Réponds UNIQUEMENT avec le JSON, sans texte avant ou après
- Les montants doivent être des nombres (pas de strings)
- Les dates doivent être au format YYYY-MM-DD
- Si une information est manquante, utilise null ou une chaîne vide selon le type`,
            },
          ],
        },
      ],
    });

    // Extraire le texte de la réponse
    const responseText = message.content[0]?.type === 'text'
      ? message.content[0].text
      : '';

    if (!responseText) {
      return {
        success: false,
        error: 'Aucune réponse reçue de l\'API',
      };
    }

    // Parser le JSON (enlever les éventuels backticks markdown)
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
    };
  } catch (error) {
    console.error('OCR Analysis error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors de l\'analyse OCR',
    };
  }
}

// Créer une nouvelle facture d'achat (imported)
export async function createInboundInvoice(
  input: CreateInboundInvoiceInput,
  fileUrl?: string,
  ocrData?: OCRData
) {
  const { companyId } = await getTenantContext();

  // Si supplierId fourni, vérifier qu'il appartient à la company
  if (input.supplierId) {
    const [supplier] = await db
      .select()
      .from(suppliers)
      .where(and(eq(suppliers.id, input.supplierId), eq(suppliers.companyId, companyId)));

    if (!supplier) {
      throw new Error('Fournisseur introuvable');
    }
  }

  // Créer la facture avec status 'imported'
  const [invoice] = await db
    .insert(inboundInvoices)
    .values({
      companyId,
      supplierId: input.supplierId || null,
      number: input.number,
      issueDate: input.issueDate,
      dueDate: input.dueDate,
      subtotal: input.subtotal.toString(),
      taxAmount: input.taxAmount.toString(),
      totalAmount: input.totalAmount.toString(),
      status: 'imported',
      notes: input.notes || null,
      fileUrl: fileUrl || null,
      ocrData: ocrData || null,
      supplierNameExtracted: ocrData?.supplierName || null,
      importedAt: new Date(),
    })
    .returning();

  revalidatePath('/admin/inbound-invoices');
  return invoice;
}

// Accepter une facture
export async function acceptInboundInvoice(invoiceId: string) {
  const { companyId } = await getTenantContext();

  const [invoice] = await db
    .select()
    .from(inboundInvoices)
    .where(and(eq(inboundInvoices.id, invoiceId), eq(inboundInvoices.companyId, companyId)));

  if (!invoice) {
    throw new Error('Facture introuvable');
  }

  if (invoice.status !== 'imported') {
    throw new Error('Seules les factures importées peuvent être acceptées');
  }

  await db
    .update(inboundInvoices)
    .set({
      status: 'accepted',
      acceptedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(inboundInvoices.id, invoiceId));

  revalidatePath('/admin/inbound-invoices');
  return { success: true };
}

// Refuser une facture
export async function refuseInboundInvoice(invoiceId: string, reason?: string) {
  const { companyId, userId } = await getTenantContext();

  const [invoice] = await db
    .select()
    .from(inboundInvoices)
    .where(and(eq(inboundInvoices.id, invoiceId), eq(inboundInvoices.companyId, companyId)));

  if (!invoice) {
    throw new Error('Facture introuvable');
  }

  if (invoice.status !== 'imported') {
    throw new Error('Seules les factures importées peuvent être refusées');
  }

  await db.transaction(async (tx) => {
    await tx
      .update(inboundInvoices)
      .set({
        status: 'refused',
        refusedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(inboundInvoices.id, invoiceId));

    // Ajouter un commentaire avec la raison
    if (reason) {
      await tx.insert(inboundInvoiceComments).values({
        inboundInvoiceId: invoiceId,
        createdBy : userId,
        content: `Facture refusée: ${reason}`,
      });
    }
  });

  revalidatePath('/admin/inbound-invoices');
  return { success: true };
}

// Ajouter un commentaire
export async function addInboundInvoiceComment(input: CreateCommentInput) {
  const { companyId, userId } = await getTenantContext();

  // Vérifier que la facture appartient à la company
  const [invoice] = await db
    .select()
    .from(inboundInvoices)
    .where(
      and(
        eq(inboundInvoices.id, input.inboundInvoiceId),
        eq(inboundInvoices.companyId, companyId)
      )
    );

  if (!invoice) {
    throw new Error('Facture introuvable');
  }

  const [comment] = await db
    .insert(inboundInvoiceComments)
    .values({
      inboundInvoiceId: input.inboundInvoiceId,
      createdBy: userId,
      content: input.content,
    })
    .returning();

  revalidatePath('/admin/inbound-invoices');
  return comment;
}

/**
 * Flow complet upload : OCR + Upload S3 + Create invoice
 * Appelé depuis upload dialog, créé facture directement SANS fournisseur
 */
export async function uploadAndCreateInvoice(input: {
  fileBase64: string;
  fileName: string;
  fileType: string;
}): Promise<{
  success: boolean;
  invoiceId?: string;
  error?: string;
}> {
  try {
    // 1. Analyse OCR
    const ocrResult = await analyzeInvoiceWithOCR(input);
    if (!ocrResult.success || !ocrResult.data) {
      return {
        success: false,
        error: ocrResult.error || 'Erreur OCR',
      };
    }

    // 2. Upload fichier Supabase Storage
    const uploadResult = await uploadInvoiceFile(
      input.fileBase64,
      input.fileName,
      input.fileType
    );

    if (!uploadResult.success || !uploadResult.url) {
      return {
        success: false,
        error: uploadResult.error || 'Erreur upload fichier',
      };
    }

    // 3. Créer facture en base SANS supplier (sera défini dans edit)
    const ocrData = ocrResult.data;

    const invoiceData: CreateInboundInvoiceInput = {
      supplierId: '', // Pas de supplier pour l'instant
      number: ocrData.invoiceNumber,
      issueDate: new Date(ocrData.issueDate),
      dueDate: ocrData.dueDate
        ? new Date(ocrData.dueDate)
        : (() => {
            const dueDate = new Date(ocrData.issueDate);
            dueDate.setDate(dueDate.getDate() + 30);
            return dueDate;
          })(),
      subtotal: ocrData.subtotal,
      taxAmount: ocrData.taxAmount,
      totalAmount: ocrData.totalAmount,
      notes: ocrData.supplierAddress
        ? `Adresse: ${ocrData.supplierAddress}`
        : undefined,
    };

    const invoice = await createInboundInvoice(
      invoiceData,
      uploadResult.url,
      ocrData
    );

    revalidatePath('/admin/inbound-invoices');

    return {
      success: true,
      invoiceId: invoice.id,
    };
  } catch (error) {
    console.error('Upload and create error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur création facture',
    };
  }
}
