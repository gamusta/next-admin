'use client';

import { useEffect, useState, useTransition } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { toast } from 'sonner';
import { createSupplier, updateSupplier, getSupplierById } from '@/actions/suppliers.actions';
import {
  CreateSupplierSchema,
  type CreateSupplierInput,
  type SupplierContact,
} from '@/types/suppliers.types';
import type { Supplier } from './columns';

interface SupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: Supplier | null;
}

export function SupplierDialog({ open, onOpenChange, supplier }: SupplierDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState('info');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<CreateSupplierInput>({
    resolver: zodResolver(CreateSupplierSchema),
    defaultValues: {
      hasSiret: true,
      country: 'France',
      contacts: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'contacts',
  });

  const hasSiret = watch('hasSiret');

  // Charger données complètes lors de l'édition
  useEffect(() => {
    if (open && supplier) {
      startTransition(async () => {
        try {
          const fullSupplier = await getSupplierById(supplier.id);
          reset({
            businessName: fullSupplier.businessName,
            siret: fullSupplier.siret || '',
            hasSiret: fullSupplier.hasSiret,
            iban: fullSupplier.iban || '',
            vatNumber: fullSupplier.vatNumber || '',
            tradeName: fullSupplier.tradeName || '',
            email: fullSupplier.email || '',
            phone: fullSupplier.phone || '',
            address: fullSupplier.address || '',
            addressComplement: fullSupplier.addressComplement || '',
            postalCode: fullSupplier.postalCode || '',
            city: fullSupplier.city || '',
            country: fullSupplier.country,
            notes: fullSupplier.notes || '',
            contacts: fullSupplier.contacts || [],
          });
        } catch (error) {
          toast.error('Erreur chargement fournisseur');
        }
      });
    } else if (open && !supplier) {
      reset({
        hasSiret: true,
        country: 'France',
        contacts: [],
      });
      setActiveTab('info');
    }
  }, [open, supplier, reset]);

  const onSubmit = (data: CreateSupplierInput) => {
    console.log('submit!!')
    startTransition(async () => {
      try {
        if (supplier) {
          await updateSupplier({ ...data, id: supplier.id });
          toast.success('Fournisseur modifié');
        } else {
          await createSupplier(data);
          toast.success('Fournisseur créé');
        }
        onOpenChange(false);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Erreur');
      }
    });
  };

  const addContact = () => {
    append({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      position: '',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {supplier ? 'Modifier fournisseur' : 'Nouveau fournisseur'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="info">Informations</TabsTrigger>
              <TabsTrigger value="contacts">Contacts</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            {/* TAB INFO */}
            <TabsContent value="info" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="businessName">
                    Raison sociale <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="businessName"
                    {...register('businessName')}
                    placeholder="ACME SARL"
                  />
                  {errors.businessName && (
                    <p className="text-sm text-destructive">{errors.businessName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tradeName">Nom commercial</Label>
                  <Input id="tradeName" {...register('tradeName')} placeholder="ACME" />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hasSiret"
                      checked={hasSiret}
                      onCheckedChange={(checked) =>
                        setValue('hasSiret', checked === true)
                      }
                    />
                    <Label htmlFor="hasSiret" className="cursor-pointer">
                      A un SIRET
                    </Label>
                  </div>
                </div>
              </div>

              {hasSiret && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="siret">SIRET</Label>
                    <Input
                      id="siret"
                      {...register('siret')}
                      placeholder="14 chiffres"
                      maxLength={14}
                    />
                    {errors.siret && (
                      <p className="text-sm text-destructive">{errors.siret.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vatNumber">N° TVA</Label>
                    <Input id="vatNumber" {...register('vatNumber')} placeholder="FR..." />
                  </div>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="contact@acme.com"
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input id="phone" {...register('phone')} placeholder="01 23 45 67 89" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Adresse</Label>
                <Input id="address" {...register('address')} placeholder="123 rue..." />
              </div>

              <div className="space-y-2">
                <Label htmlFor="addressComplement">Complément d&apos;adresse</Label>
                <Input
                  id="addressComplement"
                  {...register('addressComplement')}
                  placeholder="Bâtiment, étage..."
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Code postal</Label>
                  <Input id="postalCode" {...register('postalCode')} placeholder="75001" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">Ville</Label>
                  <Input id="city" {...register('city')} placeholder="Paris" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Pays</Label>
                  <Input id="country" {...register('country')} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="iban">IBAN</Label>
                <Input id="iban" {...register('iban')} placeholder="FR76..." />
              </div>
            </TabsContent>

            {/* TAB CONTACTS */}
            <TabsContent value="contacts" className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {fields.length} contact(s)
                </p>
                <Button type="button" variant="outline" size="sm" onClick={addContact}>
                  <IconPlus className="mr-2 h-4 w-4" />
                  Ajouter contact
                </Button>
              </div>

              {fields.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun contact. Cliquez sur &quot;Ajouter contact&quot; pour en créer un.
                </div>
              )}

              {fields.map((field, index) => (
                <div key={field.id} className="space-y-4 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Contact {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                    >
                      <IconTrash className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Prénom</Label>
                      <Input
                        {...register(`contacts.${index}.firstName`)}
                        placeholder="Jean"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>
                        Nom <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        {...register(`contacts.${index}.lastName`)}
                        placeholder="Dupont"
                      />
                      {errors.contacts?.[index]?.lastName && (
                        <p className="text-sm text-destructive">
                          {errors.contacts[index]?.lastName?.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>
                        Email <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        type="email"
                        {...register(`contacts.${index}.email`)}
                        placeholder="jean.dupont@acme.com"
                      />
                      {errors.contacts?.[index]?.email && (
                        <p className="text-sm text-destructive">
                          {errors.contacts[index]?.email?.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Téléphone</Label>
                      <Input
                        {...register(`contacts.${index}.phone`)}
                        placeholder="01 23 45 67 89"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Poste</Label>
                    <Input
                      {...register(`contacts.${index}.position`)}
                      placeholder="Responsable achats"
                    />
                  </div>
                </div>
              ))}
            </TabsContent>

            {/* TAB NOTES */}
            <TabsContent value="notes" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notes">Notes internes</Label>
                <Textarea
                  id="notes"
                  {...register('notes')}
                  placeholder="Notes, commentaires..."
                  rows={10}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Enregistrement...' : supplier ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
