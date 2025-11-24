'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { IconUpload, IconFileInvoice, IconLoader2 } from '@tabler/icons-react';
import { analyzeInvoiceWithOCR } from '@/actions/inbound-invoices.actions';
import { toast } from 'sonner';

interface UploadInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadInvoiceDialog({ open, onOpenChange }: UploadInvoiceDialogProps) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Vérifier le type de fichier
      const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(selectedFile.type)) {
        toast.error('Format de fichier non supporté. Utilisez PDF, JPG ou PNG.');
        return;
      }

      // Vérifier la taille (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (selectedFile.size > maxSize) {
        toast.error('Le fichier est trop volumineux. Taille maximum : 10MB.');
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(droppedFile.type)) {
        toast.error('Format de fichier non supporté. Utilisez PDF, JPG ou PNG.');
        return;
      }

      const maxSize = 10 * 1024 * 1024; // 10MB
      if (droppedFile.size > maxSize) {
        toast.error('Le fichier est trop volumineux. Taille maximum : 10MB.');
        return;
      }

      setFile(droppedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    try {
      // Convertir le fichier en base64
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = async () => {
        const base64 = reader.result as string;

        // Appeler l'action serveur pour analyser la facture avec OCR
        const result = await analyzeInvoiceWithOCR({
          fileBase64: base64,
          fileName: file.name,
          fileType: file.type,
        });

        if (result.success && result.data) {
          toast.success('Facture analysée avec succès');

          // Stocker les données dans sessionStorage au lieu de l'URL
          sessionStorage.setItem('invoiceUploadData', JSON.stringify({
            ocrData: result.data,
            fileName: file.name,
            fileData: base64,
          }));

          // Rediriger vers le formulaire sans params
          router.push('/admin/inbound-invoices/new');
          onOpenChange(false);
        } else {
          toast.error(result.error || 'Erreur lors de l\'analyse de la facture');
          setIsUploading(false);
        }
      };

      reader.onerror = () => {
        toast.error('Erreur lors de la lecture du fichier');
        setIsUploading(false);
      };
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erreur lors de l\'upload');
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setFile(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Importer une facture d&apos;achat</DialogTitle>
          <DialogDescription>
            Téléchargez une facture (PDF, JPG, PNG) pour l&apos;analyser automatiquement avec l&apos;OCR.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Zone de drag & drop */}
          <div
            className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
              dragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="invoice-upload"
              className="absolute inset-0 z-10 cursor-pointer opacity-0"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              disabled={isUploading}
            />

            {file ? (
              <div className="flex flex-col items-center gap-2">
                <IconFileInvoice className="size-12 text-primary" />
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <IconUpload className="size-12 text-muted-foreground" />
                <p className="text-sm font-medium">
                  Glissez-déposez votre facture ici
                </p>
                <p className="text-xs text-muted-foreground">
                  ou cliquez pour parcourir
                </p>
                <p className="text-xs text-muted-foreground">
                  PDF, JPG, PNG - Max 10MB
                </p>
              </div>
            )}
          </div>

          {file && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setFile(null)}
                disabled={isUploading}
                className="flex-1"
              >
                Changer de fichier
              </Button>
              <Button
                onClick={handleUpload}
                disabled={isUploading}
                className="flex-1"
              >
                {isUploading ? (
                  <>
                    <IconLoader2 className="mr-2 size-4 animate-spin" />
                    Analyse en cours...
                  </>
                ) : (
                  <>
                    <IconUpload className="mr-2 size-4" />
                    Analyser
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
