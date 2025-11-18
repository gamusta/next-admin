import { db } from './drizzle';
import { users, companies, companyUsers } from './schema';
import { hashPassword } from '@/lib/auth/session';

async function seed() {

  if (process.env.NODE_ENV === 'production') {
    console.error(' ❌ Seed cannot run in production!');
    process.exit(1);
  }

  if (process.env.ALLOW_SEED !== 'true') {
    console.error(' ❌ Set ALLOW_SEED=true to run seed');
    process.exit(1);
  }

  console.log(' 🌱 Starting seed...');

  await db.delete(companyUsers);
  await db.delete(users);
  await db.delete(companies);

  const [company] = await db
    .insert(companies)
    .values([
      {
        name: "Proactive Agency",
        slug: "proactive-agency",
        email: "contact@proactive.ma"
      },
    ])
    .returning();

  const [user] = await db
    .insert(users)
    .values([
      {
        email: "gamusta@gmail.com",
        firstName: "Mustapha",
        lastName: "GANGA",
        avatar: "https://github.com/shadcn.png",
        password: await hashPassword('admin123')
      },
    ])
    .returning();

  await db.insert(companyUsers).values({
    companyId: company.id,
    userId: user.id,
    role: 'owner',
  });
}

seed()
  .then(() => {
    console.log(' ✅ Seed completed successfully!');
  })
  .catch((error) => {
    console.error(' ❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
