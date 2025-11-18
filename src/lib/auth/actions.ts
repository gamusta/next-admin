'use server';

import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { comparePasswords, setSession, hashPassword } from './session';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

const signInSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

export async function signIn(formData: FormData) {
  const rawData = {
    email: formData.get('email'),
    password: formData.get('password'),
  };

  const parsed = signInSchema.safeParse(rawData);

  if (!parsed.success) {
    return { error: 'Données invalides' };
  }

  const { email, password } = parsed.data;

  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return { error: 'Email ou mot de passe incorrect' };
    }

    const isPasswordValid = await comparePasswords(password, user.password);

    if (!isPasswordValid) {
      return { error: 'Email ou mot de passe incorrect' };
    }

    if (!user.isActive) {
      return { error: 'Compte désactivé' };
    }

    await setSession(user);
  } catch (error) {
    console.error('Erreur signIn:', error);
    return { error: 'Erreur serveur' };
  }

  redirect('/admin');
}

export async function signOut() {
  (await cookies()).delete('session');
  redirect('/sign-in');
}

const signUpSchema = z.object({
  firstName: z.string().min(1, 'Prénom requis'),
  lastName: z.string().min(1, 'Nom requis'),
  email: z.email('Email invalide'),
  password: z.string().min(8, 'Mot de passe min 8 caractères'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mots de passe différents',
  path: ['confirmPassword'],
});

export async function signUp(formData: FormData) {
  const rawData = {
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  };

  const parsed = signUpSchema.safeParse(rawData);

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return { error: Object.values(errors).flat()[0] || 'Données invalides' };
  }

  const { firstName, lastName, email, password } = parsed.data;

  try {
    // Vérifier si email existe
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser) {
      return { error: 'Email déjà utilisé' };
    }

    // Créer utilisateur
    const hashedPassword = await hashPassword(password);
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        isActive: true,
      })
      .returning();

    await setSession(newUser);
  } catch (error) {
    console.error('Erreur signUp:', error);
    return { error: 'Erreur serveur' };
  }

  redirect('/admin');
}
