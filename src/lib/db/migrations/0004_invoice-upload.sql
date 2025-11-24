ALTER TABLE "inbound_invoices" ADD COLUMN "file_url" text;--> statement-breakpoint
CREATE INDEX "inbound_inv_company_status_idx" ON "inbound_invoices" USING btree ("company_id","status");--> statement-breakpoint
CREATE INDEX "inbound_inv_company_due_date_idx" ON "inbound_invoices" USING btree ("company_id","due_date");--> statement-breakpoint
CREATE INDEX "inbound_inv_company_issue_date_idx" ON "inbound_invoices" USING btree ("company_id","issue_date");--> statement-breakpoint
CREATE INDEX "inbound_inv_supplier_idx" ON "inbound_invoices" USING btree ("supplier_id");--> statement-breakpoint
ALTER TABLE "inbound_invoices" ADD CONSTRAINT "inbound_inv_number_uniq" UNIQUE("company_id","supplier_id","number");
