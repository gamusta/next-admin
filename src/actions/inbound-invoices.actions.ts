'use server';

import { db } from '@/lib/db/drizzle';
import { inboundInvoices, suppliers, inboundInvoiceComments } from '@/lib/db/schema';
import { getTenantContext } from '@/lib/tenant';
import { uploadInvoiceFile } from '@/lib/storage';
import { eq, desc, and } from 'drizzle-orm';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { revalidatePath } from 'next/cache';
import { getOCROrchestrator } from '@/lib/ocr/ocr-orchestrator';
import type {
  CreateInboundInvoiceInput,
  CreateCommentInput,
} from '@/types/inbound-invoices.types';
import type { OCRData } from '@/types/ocr.types';

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
    issueDateFormatted: invoice.issueDate ? format(invoice.issueDate, 'dd/MM/yyyy', { locale: fr }) : '-',
    dueDateFormatted: invoice.dueDate ? format(invoice.dueDate, 'dd/MM/yyyy', { locale: fr }) : '-',
    // Garder dates ISO pour filtres (ou null si pas de date)
    issueDate: invoice.issueDate ? invoice.issueDate.toISOString() : '',
    dueDate: invoice.dueDate ? invoice.dueDate.toISOString() : '',
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

/**
 * Analyser facture avec OCR (avec fallback automatique)
 * Utilise orchestrateur pour tenter plusieurs extracteurs
 */
export async function analyzeInvoiceWithOCR(input: {
  fileBase64: string;
  fileName: string;
  fileType: string;
}): Promise<{ success: boolean; data?: OCRData; error?: string; extractorUsed?: string; rawOcrData?: unknown }> {
  const orchestrator = getOCROrchestrator('inbound-invoice');
  const result = await orchestrator.extract(input);
  return {
    success: result.success,
    data: result.data as OCRData,
    error: result.error,
    extractorUsed: result.extractorUsed,
    rawOcrData: result.rawOcrData,
  };
}

/**
 * Analyser avec extracteur spécifique (pas de fallback)
 */
export async function analyzeInvoiceWithExtractor(
  input: {
    fileBase64: string;
    fileName: string;
    fileType: string;
  },
  extractorName: string
): Promise<{ success: boolean; data?: OCRData; error?: string; extractorUsed?: string; rawOcrData?: unknown }> {
  const orchestrator = getOCROrchestrator('inbound-invoice');
  const result = await orchestrator.extractWith(extractorName, input);
  return {
    success: result.success,
    data: result.data as OCRData,
    error: result.error,
    extractorUsed: result.extractorUsed,
    rawOcrData: result.rawOcrData,
  };
}

/**
 * Lister extracteurs disponibles
 */
export async function getAvailableExtractors(): Promise<string[]> {
  const orchestrator = getOCROrchestrator('inbound-invoice');
  return await orchestrator.getAvailableExtractors();
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
      number: input.number || '-',
      issueDate: input.issueDate || null,
      dueDate: input.dueDate || null,
      subtotal: input.subtotal?.toString() || '0',
      taxAmount: input.taxAmount?.toString() || '0',
      totalAmount: input.totalAmount?.toString() || '0',
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

// Associer/modifier supplier d'une invoice
export async function updateInboundInvoiceSupplier(
  invoiceId: string,
  supplierId: string
) {
  const { companyId } = await getTenantContext();

  // Vérif invoice appartient company
  const [invoice] = await db
    .select()
    .from(inboundInvoices)
    .where(
      and(
        eq(inboundInvoices.id, invoiceId),
        eq(inboundInvoices.companyId, companyId)
      )
    );

  if (!invoice) {
    throw new Error('Facture introuvable');
  }

  // Vérif supplier appartient company
  const [supplier] = await db
    .select()
    .from(suppliers)
    .where(
      and(
        eq(suppliers.id, supplierId),
        eq(suppliers.companyId, companyId)
      )
    );

  if (!supplier) {
    throw new Error('Fournisseur introuvable');
  }

  // Update supplierId
  await db
    .update(inboundInvoices)
    .set({
      supplierId,
      updatedAt: new Date(),
    })
    .where(eq(inboundInvoices.id, invoiceId));

  revalidatePath('/admin/inbound-invoices');
  revalidatePath(`/admin/inbound-invoices/${invoiceId}/edit`);
  return { success: true };
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
      supplierId: null,
      number: ocrData.invoiceNumber,
      issueDate: ocrData.issueDate ? new Date(ocrData.issueDate) : null,
      dueDate: ocrData.dueDate ? new Date(ocrData.dueDate) : null,
      subtotal: ocrData.subtotal,
      taxAmount: ocrData.taxAmount,
      totalAmount: ocrData.totalAmount,
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
