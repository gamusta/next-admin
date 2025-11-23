'use client';

import { useState, useTransition } from 'react';
import { DataTable } from './data-table';
import { columns, type Supplier } from './columns';
import { Button } from '@/components/ui/button';
import { IconPlus } from '@tabler/icons-react';
import { SupplierDialog } from './supplier-dialog';
import { deleteSupplier, toggleArchiveSupplier } from '@/actions/suppliers.actions';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface SuppliersContentProps {
  suppliers: Supplier[];
}

export function SuppliersContent({ suppliers }: SuppliersContentProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setIsDialogOpen(true);
  };

  const handleNew = () => {
    setEditingSupplier(null);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (!deleteId) return;

    startTransition(async () => {
      try {
        await deleteSupplier(deleteId);
        toast.success('Fournisseur supprimé');
        setDeleteId(null);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Erreur suppression');
      }
    });
  };

  const handleToggleArchive = (id: string) => {
    startTransition(async () => {
      try {
        await toggleArchiveSupplier(id);
        toast.success('Statut modifié');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Erreur');
      }
    });
  };

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <Button onClick={handleNew}>
          <IconPlus className="mr-2 h-4 w-4" />
          Nouveau fournisseur
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={suppliers}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleArchive={handleToggleArchive}
      />

      <SupplierDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        supplier={editingSupplier}
      />

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Le fournisseur sera supprimé définitivement.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isPending}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
