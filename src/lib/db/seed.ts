import { db } from './drizzle';
import { users, companies, companyUsers } from './schema';
import { clients } from './schema/clients';
import { quotes } from './schema/quotes';
import { invoices } from './schema/invoices';
import { lineItems } from './schema/line-items';
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

  await db.delete(lineItems);
  await db.delete(invoices);
  await db.delete(quotes);
  await db.delete(clients);
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

  // Clients
  const clientsData = await db
    .insert(clients)
    .values([
      {
        companyId: company.id,
        name: "SARL Digitech",
        email: "contact@digitech.fr",
        phone: "01 23 45 67 89",
        address: "12 Rue de la Paix",
        city: "Paris",
        postalCode: "75002",
        country: "FR",
        siret: "12345678901234",
        vatNumber: "FR12345678901",
      },
      {
        companyId: company.id,
        name: "SAS Innovation Lab",
        email: "hello@innovlab.fr",
        phone: "04 56 78 90 12",
        address: "45 Avenue des Champs",
        city: "Lyon",
        postalCode: "69001",
        country: "FR",
        siret: "98765432109876",
        vatNumber: "FR98765432109",
      },
      {
        companyId: company.id,
        name: "Entreprise Martin EURL",
        email: "martin@entreprise.fr",
        phone: "02 34 56 78 90",
        address: "8 Boulevard du Commerce",
        city: "Nantes",
        postalCode: "44000",
        country: "FR",
        siret: "11223344556677",
        vatNumber: "FR11223344556",
      },
      {
        companyId: company.id,
        name: "Tech Solutions SAS",
        email: "contact@techsolutions.fr",
        phone: "05 67 89 01 23",
        address: "33 Rue du Développement",
        city: "Toulouse",
        postalCode: "31000",
        country: "FR",
        siret: "55667788990011",
        vatNumber: "FR55667788990",
      },
      {
        companyId: company.id,
        name: "Consulting Pro",
        email: "info@consultingpro.fr",
        phone: "03 45 67 89 01",
        address: "22 Place du Marché",
        city: "Marseille",
        postalCode: "13001",
        country: "FR",
        siret: "99887766554433",
        vatNumber: "FR99887766554",
      },
    ])
    .returning();

  // Quotes
  const quotesData = await db
    .insert(quotes)
    .values([
      {
        companyId: company.id,
        clientId: clientsData[0].id,
        number: "DEV-2025-001",
        issueDate: new Date("2025-01-15"),
        expiryDate: new Date("2025-02-15"),
        subtotal: "5000.00",
        taxAmount: "1000.00",
        totalAmount: "6000.00",
        status: "signed",
        sentAt: new Date("2025-01-15"),
        signedAt: new Date("2025-01-20"),
        notes: "Développement site web vitrine",
      },
      {
        companyId: company.id,
        clientId: clientsData[1].id,
        number: "DEV-2025-002",
        issueDate: new Date("2025-01-20"),
        expiryDate: new Date("2025-02-20"),
        subtotal: "12000.00",
        taxAmount: "2400.00",
        totalAmount: "14400.00",
        status: "pending",
        sentAt: new Date("2025-01-20"),
        notes: "Application mobile iOS/Android",
      },
      {
        companyId: company.id,
        clientId: clientsData[2].id,
        number: "DEV-2025-003",
        issueDate: new Date("2025-01-25"),
        expiryDate: new Date("2025-02-25"),
        subtotal: "3500.00",
        taxAmount: "700.00",
        totalAmount: "4200.00",
        status: "draft",
        notes: "Maintenance site web",
      },
      {
        companyId: company.id,
        clientId: clientsData[3].id,
        number: "DEV-2025-004",
        issueDate: new Date("2025-02-01"),
        expiryDate: new Date("2025-03-01"),
        subtotal: "8500.00",
        taxAmount: "1700.00",
        totalAmount: "10200.00",
        status: "refused",
        sentAt: new Date("2025-02-01"),
        rejectedAt: new Date("2025-02-05"),
        notes: "Refonte complète site e-commerce",
      },
      {
        companyId: company.id,
        clientId: clientsData[4].id,
        number: "DEV-2025-005",
        issueDate: new Date("2025-02-10"),
        expiryDate: new Date("2025-03-10"),
        subtotal: "6000.00",
        taxAmount: "1200.00",
        totalAmount: "7200.00",
        status: "to_send",
        notes: "Formation équipe développement",
      },
    ])
    .returning();

  // Invoices
  const invoicesData = await db
    .insert(invoices)
    .values([
      {
        companyId: company.id,
        clientId: clientsData[0].id,
        quoteId: quotesData[0].id,
        number: "FAC-2025-001",
        issueDate: new Date("2025-01-25"),
        dueDate: new Date("2025-02-25"),
        subtotal: "5000.00",
        taxAmount: "1000.00",
        totalAmount: "6000.00",
        status: "paid",
        sentAt: new Date("2025-01-25"),
        paidAt: new Date("2025-02-15"),
        paymentMethod: "virement",
        paymentReference: "VIR-20250215-001",
      },
      {
        companyId: company.id,
        clientId: clientsData[1].id,
        number: "FAC-2025-002",
        issueDate: new Date("2025-02-01"),
        dueDate: new Date("2025-03-01"),
        subtotal: "3200.00",
        taxAmount: "640.00",
        totalAmount: "3840.00",
        status: "sent",
        sentAt: new Date("2025-02-01"),
        notes: "Consultance stratégique digitale",
      },
      {
        companyId: company.id,
        clientId: clientsData[2].id,
        number: "FAC-2025-003",
        issueDate: new Date("2025-01-10"),
        dueDate: new Date("2025-02-10"),
        subtotal: "1500.00",
        taxAmount: "300.00",
        totalAmount: "1800.00",
        status: "overdue",
        sentAt: new Date("2025-01-10"),
      },
      {
        companyId: company.id,
        clientId: clientsData[3].id,
        number: "FAC-2025-004",
        issueDate: new Date("2025-02-15"),
        dueDate: new Date("2025-03-15"),
        subtotal: "7800.00",
        taxAmount: "1560.00",
        totalAmount: "9360.00",
        status: "draft",
      },
    ])
    .returning();

  // Line Items pour Quotes
  await db.insert(lineItems).values([
    // Quote 1 (DEV-2025-001)
    {
      quoteId: quotesData[0].id,
      type: "service",
      description: "Développement frontend React",
      quantity: "20",
      unitPrice: "150.00",
      taxRate: "20.00",
      subtotal: "3000.00",
      taxAmount: "600.00",
      totalAmount: "3600.00",
      position: 0,
    },
    {
      quoteId: quotesData[0].id,
      type: "service",
      description: "Intégration backend Node.js",
      quantity: "10",
      unitPrice: "150.00",
      taxRate: "20.00",
      subtotal: "1500.00",
      taxAmount: "300.00",
      totalAmount: "1800.00",
      position: 1,
    },
    {
      quoteId: quotesData[0].id,
      type: "service",
      description: "Déploiement et configuration serveur",
      quantity: "5",
      unitPrice: "100.00",
      taxRate: "20.00",
      subtotal: "500.00",
      taxAmount: "100.00",
      totalAmount: "600.00",
      position: 2,
    },
    // Quote 2 (DEV-2025-002)
    {
      quoteId: quotesData[1].id,
      type: "service",
      description: "Développement application mobile iOS",
      quantity: "40",
      unitPrice: "180.00",
      taxRate: "20.00",
      subtotal: "7200.00",
      taxAmount: "1440.00",
      totalAmount: "8640.00",
      position: 0,
    },
    {
      quoteId: quotesData[1].id,
      type: "service",
      description: "Développement application mobile Android",
      quantity: "40",
      unitPrice: "120.00",
      taxRate: "20.00",
      subtotal: "4800.00",
      taxAmount: "960.00",
      totalAmount: "5760.00",
      position: 1,
    },
    // Quote 3 (DEV-2025-003)
    {
      quoteId: quotesData[2].id,
      type: "service",
      description: "Maintenance mensuelle site web",
      quantity: "12",
      unitPrice: "250.00",
      taxRate: "20.00",
      subtotal: "3000.00",
      taxAmount: "600.00",
      totalAmount: "3600.00",
      position: 0,
    },
    {
      quoteId: quotesData[2].id,
      type: "service",
      description: "Hébergement annuel",
      quantity: "1",
      unitPrice: "500.00",
      taxRate: "20.00",
      subtotal: "500.00",
      taxAmount: "100.00",
      totalAmount: "600.00",
      position: 1,
    },
  ]);

  // Line Items pour Invoices
  await db.insert(lineItems).values([
    // Invoice 1 (FAC-2025-001)
    {
      invoiceId: invoicesData[0].id,
      type: "service",
      description: "Développement frontend React",
      quantity: "20",
      unitPrice: "150.00",
      taxRate: "20.00",
      subtotal: "3000.00",
      taxAmount: "600.00",
      totalAmount: "3600.00",
      position: 0,
    },
    {
      invoiceId: invoicesData[0].id,
      type: "service",
      description: "Intégration backend Node.js",
      quantity: "10",
      unitPrice: "150.00",
      taxRate: "20.00",
      subtotal: "1500.00",
      taxAmount: "300.00",
      totalAmount: "1800.00",
      position: 1,
    },
    {
      invoiceId: invoicesData[0].id,
      type: "service",
      description: "Déploiement et configuration serveur",
      quantity: "5",
      unitPrice: "100.00",
      taxRate: "20.00",
      subtotal: "500.00",
      taxAmount: "100.00",
      totalAmount: "600.00",
      position: 2,
    },
    // Invoice 2 (FAC-2025-002)
    {
      invoiceId: invoicesData[1].id,
      type: "service",
      description: "Audit technique infrastructure",
      quantity: "8",
      unitPrice: "200.00",
      taxRate: "20.00",
      subtotal: "1600.00",
      taxAmount: "320.00",
      totalAmount: "1920.00",
      position: 0,
    },
    {
      invoiceId: invoicesData[1].id,
      type: "service",
      description: "Recommandations et plan d'action",
      quantity: "8",
      unitPrice: "200.00",
      taxRate: "20.00",
      subtotal: "1600.00",
      taxAmount: "320.00",
      totalAmount: "1920.00",
      position: 1,
    },
    // Invoice 3 (FAC-2025-003)
    {
      invoiceId: invoicesData[2].id,
      type: "service",
      description: "Formation équipe",
      quantity: "10",
      unitPrice: "150.00",
      taxRate: "20.00",
      subtotal: "1500.00",
      taxAmount: "300.00",
      totalAmount: "1800.00",
      position: 0,
    },
  ]);

  console.log(' ✅ Clients créés:', clientsData.length);
  console.log(' ✅ Devis créés:', quotesData.length);
  console.log(' ✅ Factures créées:', invoicesData.length);
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
