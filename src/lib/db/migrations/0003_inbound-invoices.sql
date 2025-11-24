CREATE TYPE "public"."inbound_invoice_status" AS ENUM('imported', 'accepted', 'paid', 'refused');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('card', 'transfer', 'debit', 'credit_note', 'check', 'cash');--> statement-breakpoint
CREATE TABLE "inbound_invoice_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inbound_invoice_id" uuid NOT NULL,
	"content" text NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inbound_invoice_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inbound_invoice_id" uuid NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"payment_date" timestamp NOT NULL,
	"payment_method" "payment_method" NOT NULL,
	"reference" text,
	"notes" text,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inbound_invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"number" text NOT NULL,
	"issue_date" timestamp NOT NULL,
	"due_date" timestamp NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"tax_amount" numeric(10, 2) NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"status" "inbound_invoice_status" DEFAULT 'imported' NOT NULL,
	"imported_at" timestamp DEFAULT now() NOT NULL,
	"accepted_at" timestamp,
	"paid_at" timestamp,
	"refused_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "inbound_invoice_comments" ADD CONSTRAINT "inbound_invoice_comments_invoices_id_fk" FOREIGN KEY ("inbound_invoice_id") REFERENCES "public"."inbound_invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inbound_invoice_comments" ADD CONSTRAINT "inbound_invoice_comments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inbound_invoice_payments" ADD CONSTRAINT "inbound_invoice_payments_invoices_id_fk" FOREIGN KEY ("inbound_invoice_id") REFERENCES "public"."inbound_invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inbound_invoice_payments" ADD CONSTRAINT "inbound_invoice_payments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inbound_invoices" ADD CONSTRAINT "inbound_invoices_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inbound_invoices" ADD CONSTRAINT "inbound_invoices_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "inbound_invoice_comments_invoice_idx" ON "inbound_invoice_comments" USING btree ("inbound_invoice_id");--> statement-breakpoint
CREATE INDEX "inbound_invoice_comments_created_at_idx" ON "inbound_invoice_comments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "inbound_invoice_payments_invoice_idx" ON "inbound_invoice_payments" USING btree ("inbound_invoice_id");--> statement-breakpoint
CREATE INDEX "inbound_invoice_payments_payment_date_idx" ON "inbound_invoice_payments" USING btree ("payment_date");--> statement-breakpoint
CREATE INDEX "inbound_invoices_company_idx" ON "inbound_invoices" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "inbound_invoices_supplier_idx" ON "inbound_invoices" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "inbound_invoices_status_idx" ON "inbound_invoices" USING btree ("status");--> statement-breakpoint
CREATE INDEX "inbound_invoices_number_idx" ON "inbound_invoices" USING btree ("company_id","number");--> statement-breakpoint
CREATE INDEX "inbound_invoices_due_date_idx" ON "inbound_invoices" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "inbound_invoices_issue_date_idx" ON "inbound_invoices" USING btree ("issue_date");
