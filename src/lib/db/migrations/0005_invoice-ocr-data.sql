ALTER TABLE "inbound_invoices" ALTER COLUMN "supplier_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "inbound_invoices" ADD COLUMN "ocr_data" jsonb;