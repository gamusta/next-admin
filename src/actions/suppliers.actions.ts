'use server';

import { db } from '@/lib/db/drizzle';
import { suppliers, supplierContacts } from '@/lib/db/schema';
import { getTenantContext } from '@/lib/tenant';
import { eq, and } from 'drizzle-orm';
import {
  CreateSupplierSchema,
  UpdateSupplierSchema,
  type CreateSupplierInput,
  type UpdateSupplierInput,
} from '@/types/suppliers.types';
import { revalidatePath } from 'next/cache';

export async function getSuppliers() {
  const { companyId } = await getTenantContext();

  const result = await db
    .select({
      id: suppliers.id,
      businessName: suppliers.businessName,
      city: suppliers.city,
      email: suppliers.email,
      phone: suppliers.phone,
      siret: suppliers.siret,
      isArchived: suppliers.isArchived,
    })
    .from(suppliers)
    .where(eq(suppliers.companyId, companyId))
    .orderBy(suppliers.createdAt);

  return result;
}

export async function getSupplierById(id: string) {
  const { companyId } = await getTenantContext();

  const [supplier] = await db
    .select()
    .from(suppliers)
    .where(and(eq(suppliers.id, id), eq(suppliers.companyId, companyId)));

  if (!supplier) {
    throw new Error('Fournisseur introuvable');
  }

  // Récupérer contacts
  const contacts = await db
    .select()
    .from(supplierContacts)
    .where(
      and(
        eq(supplierContacts.supplierId, id),
        eq(supplierContacts.companyId, companyId)
      )
    );

  return {
    ...supplier,
    contacts,
  };
}

export async function createSupplier(rawInput: unknown) {
  const { companyId, role } = await getTenantContext();

  // Vérif permissions
  if (role === 'accountant') {
    throw new Error('Forbidden: accountant ne peut pas créer de fournisseurs');
  }

  const input = CreateSupplierSchema.parse(rawInput);

  // Transaction: créer supplier + contacts
  const result = await db.transaction(async (tx) => {
    const [newSupplier] = await tx
      .insert(suppliers)
      .values({
        companyId,
        businessName: input.businessName,
        siret: input.siret || null,
        hasSiret: input.hasSiret,
        iban: input.iban || null,
        vatNumber: input.vatNumber || null,
        tradeName: input.tradeName || null,
        nafCodeId: input.nafCodeId || null,
        legalFormId: input.legalFormId || null,
        email: input.email || null,
        phone: input.phone || null,
        address: input.address || null,
        addressComplement: input.addressComplement || null,
        postalCode: input.postalCode || null,
        city: input.city || null,
        country: input.country,
        notes: input.notes || null,
      })
      .returning();

    // Créer contacts si présents
    if (input.contacts && input.contacts.length > 0) {
      await tx.insert(supplierContacts).values(
        input.contacts.map((contact) => ({
          companyId,
          supplierId: newSupplier.id,
          firstName: contact.firstName || null,
          lastName: contact.lastName,
          email: contact.email,
          phone: contact.phone || null,
          position: contact.position || null,
        }))
      );
    }

    return newSupplier;
  });

  revalidatePath('/admin/suppliers');
  return result;
}

export async function updateSupplier(rawInput: unknown) {
  const { companyId, role } = await getTenantContext();

  if (role === 'accountant') {
    throw new Error('Forbidden: accountant ne peut pas modifier de fournisseurs');
  }

  const input = UpdateSupplierSchema.parse(rawInput);

  // Vérifier que le supplier appartient bien à la company
  const [existing] = await db
    .select()
    .from(suppliers)
    .where(and(eq(suppliers.id, input.id), eq(suppliers.companyId, companyId)));

  if (!existing) {
    throw new Error('Fournisseur introuvable');
  }

  // Transaction: update supplier + remplacer contacts
  await db.transaction(async (tx) => {
    await tx
      .update(suppliers)
      .set({
        businessName: input.businessName,
        siret: input.siret || null,
        hasSiret: input.hasSiret,
        iban: input.iban || null,
        vatNumber: input.vatNumber || null,
        tradeName: input.tradeName || null,
        nafCodeId: input.nafCodeId || null,
        legalFormId: input.legalFormId || null,
        email: input.email || null,
        phone: input.phone || null,
        address: input.address || null,
        addressComplement: input.addressComplement || null,
        postalCode: input.postalCode || null,
        city: input.city || null,
        country: input.country,
        notes: input.notes || null,
        updatedAt: new Date(),
      })
      .where(eq(suppliers.id, input.id));

    // Supprimer anciens contacts
    await tx
      .delete(supplierContacts)
      .where(
        and(
          eq(supplierContacts.supplierId, input.id),
          eq(supplierContacts.companyId, companyId)
        )
      );

    // Recréer contacts
    if (input.contacts && input.contacts.length > 0) {
      await tx.insert(supplierContacts).values(
        input.contacts.map((contact) => ({
          companyId,
          supplierId: input.id,
          firstName: contact.firstName || null,
          lastName: contact.lastName,
          email: contact.email,
          phone: contact.phone || null,
          position: contact.position || null,
        }))
      );
    }
  });

  revalidatePath('/admin/suppliers');
  return { success: true };
}

export async function deleteSupplier(id: string) {
  const { companyId, role } = await getTenantContext();

  if (role === 'accountant') {
    throw new Error('Forbidden: accountant ne peut pas supprimer de fournisseurs');
  }

  // Vérifier appartenance
  const [existing] = await db
    .select()
    .from(suppliers)
    .where(and(eq(suppliers.id, id), eq(suppliers.companyId, companyId)));

  if (!existing) {
    throw new Error('Fournisseur introuvable');
  }

  // Supprimer (cascade sur contacts)
  await db.delete(suppliers).where(eq(suppliers.id, id));

  revalidatePath('/admin/suppliers');
  return { success: true };
}

export async function toggleArchiveSupplier(id: string) {
  const { companyId, role } = await getTenantContext();

  if (role === 'accountant') {
    throw new Error('Forbidden');
  }

  const [existing] = await db
    .select()
    .from(suppliers)
    .where(and(eq(suppliers.id, id), eq(suppliers.companyId, companyId)));

  if (!existing) {
    throw new Error('Fournisseur introuvable');
  }

  await db
    .update(suppliers)
    .set({
      isArchived: !existing.isArchived,
      updatedAt: new Date(),
    })
    .where(eq(suppliers.id, id));

  revalidatePath('/admin/suppliers');
  return { success: true };
}
