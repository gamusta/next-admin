ALTER TABLE "inbound_invoices" ADD COLUMN "supplier_name_extracted" text;--> statement-breakpoint
ALTER TABLE "suppliers" ADD COLUMN "bic" text;--> statement-breakpoint
ALTER TABLE "suppliers" ADD COLUMN "bank_name" text;