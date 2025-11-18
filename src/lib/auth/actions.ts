'use server';

import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { comparePasswords, setSession } from './session';
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
