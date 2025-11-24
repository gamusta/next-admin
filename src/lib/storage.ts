'use server';

import { createClient } from '@supabase/supabase-js';
import { getTenantContext } from './tenant';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials');
}

// Client Supabase avec service role key (permissions admin)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const BUCKET_NAME = 'inbound-invoices';

/**
 * Upload fichier facture vers Supabase Storage
 * @param file Fichier base64
 * @param fileName Nom fichier
 * @param fileType MIME type
 * @returns URL publique du fichier
 */
export async function uploadInvoiceFile(
  file: string,
  fileName: string,
  fileType: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const { companyId } = await getTenantContext();

    // Extraire base64 pur (sans prefix data:...)
    const base64Data = file.includes('base64,')
      ? file.split('base64,')[1]
      : file;

    // Convertir base64 → Buffer
    const buffer = Buffer.from(base64Data, 'base64');

    // Path: company_id/timestamp_filename
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${companyId}/${timestamp}_${sanitizedFileName}`;

    // Upload vers Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, buffer, {
        contentType: fileType,
        upsert: false,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return {
        success: false,
        error: `Erreur upload: ${error.message}`,
      };
    }

    // Récupérer URL publique
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    return {
      success: true,
      url: publicUrlData.publicUrl,
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur upload fichier',
    };
  }
}

/**
 * Supprimer fichier facture de Supabase Storage
 */
export async function deleteInvoiceFile(fileUrl: string): Promise<boolean> {
  try {
    // Extraire path depuis URL
    const url = new URL(fileUrl);
    const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);

    if (!pathMatch) {
      console.error('Invalid file URL format');
      return false;
    }

    const filePath = pathMatch[1];

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete error:', error);
    return false;
  }
}
