ALTER TABLE "inbound_invoices" ALTER COLUMN "issue_date" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "inbound_invoices" ALTER COLUMN "due_date" DROP NOT NULL;