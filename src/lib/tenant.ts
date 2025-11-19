import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db/drizzle';
import { companyUsers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { redirect } from 'next/navigation';

export async function getTenantContext() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/sign-in');
  }

  const companyUser = await db.query.companyUsers.findFirst({
    where: and(
      eq(companyUsers.userId, user.id),
      eq(companyUsers.isActive, true)
    ),
  });

  if (!companyUser) {
    throw new Error('No active company found for user');
  }

  return {
    userId: user.id,
    companyId: companyUser.companyId,
    role: companyUser.role,
  };
}
