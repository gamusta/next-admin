import { z } from 'zod';

export const SupplierContactSchema = z.object({
  id: z.uuid().optional(),
  firstName: z.string().optional(),
  lastName: z.string().min(1, 'Nom requis'),
  email: z.email('Email invalide'),
  phone: z.string().optional(),
  position: z.string().optional(),
});

export const CreateSupplierSchema = z.object({
  businessName: z.string().min(1, 'Raison sociale requise'),
  siret: z.string().length(14, 'SIRET doit contenir 14 caractères').optional(),
  hasSiret: z.boolean().default(true),
  iban: z.string().optional(),
  vatNumber: z.string().optional(),
  tradeName: z.string().optional(),
  nafCodeId: z.uuid().optional(),
  legalFormId: z.uuid().optional(),
  email: z.email('Email invalide').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  addressComplement: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  country: z.string().default('France'),
  notes: z.string().optional(),
  contacts: z.array(SupplierContactSchema).default([]),
}).refine(
  (data) => {
    if (data.hasSiret && !data.siret) {
      return false;
    }
    return true;
  },
  {
    message: 'SIRET requis si "A un SIRET" est coché',
    path: ['siret'],
  }
);

export const UpdateSupplierSchema = CreateSupplierSchema.safeExtend({
  id: z.uuid(),
});

export type CreateSupplierInput = z.infer<typeof CreateSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof UpdateSupplierSchema>;
export type SupplierContact = z.infer<typeof SupplierContactSchema>;

export interface Supplier {
  id: string;
  businessName: string;
  siret: string | null;
  hasSiret: boolean;
  iban: string | null;
  vatNumber: string | null;
  tradeName: string | null;
  nafCodeId: string | null;
  legalFormId: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  addressComplement: string | null;
  postalCode: string | null;
  city: string | null;
  country: string;
  notes: string | null;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SupplierWithContacts extends Supplier {
  contacts: SupplierContact[];
}
