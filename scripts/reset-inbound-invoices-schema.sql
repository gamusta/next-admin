-- Script pour réinitialiser le schéma des factures d'achat
-- À exécuter dans Supabase SQL Editor avant de relancer la migration

-- 1. Supprimer les tables (CASCADE supprime aussi les foreign keys)
DROP TABLE IF EXISTS inbound_invoice_comments CASCADE;
DROP TABLE IF EXISTS inbound_invoice_payments CASCADE;
DROP TABLE IF EXISTS inbound_invoices CASCADE;

-- 2. Supprimer les enums
DROP TYPE IF EXISTS inbound_invoice_status CASCADE;
DROP TYPE IF EXISTS payment_method CASCADE;

-- 3. Vérifier la suppression
SELECT
  'Type enum restant' as type,
  typname as name
FROM pg_type
WHERE typname LIKE '%inbound%' OR typname LIKE '%payment%'
UNION ALL
SELECT
  'Table restante' as type,
  tablename as name
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename LIKE '%inbound%';

-- Si la requête ci-dessus ne retourne rien, c'est bon !
-- Vous pouvez maintenant relancer: npm run db:push
