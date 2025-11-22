CREATE TABLE "naf_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"label" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "naf_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "legal_forms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"label" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "legal_forms_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"business_name" text NOT NULL,
	"siret" text,
	"has_siret" boolean DEFAULT true NOT NULL,
	"iban" text,
	"vat_number" text,
	"trade_name" text,
	"naf_code_id" uuid,
	"legal_form_id" uuid,
	"email" text,
	"phone" text,
	"address" text,
	"address_complement" text,
	"postal_code" text,
	"city" text,
	"country" text DEFAULT 'France' NOT NULL,
	"notes" text,
	"is_archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "suppliers_siret_company_unique" UNIQUE("siret","company_id")
);
--> statement-breakpoint
CREATE TABLE "supplier_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"first_name" text,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"position" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_naf_code_id_naf_codes_id_fk" FOREIGN KEY ("naf_code_id") REFERENCES "public"."naf_codes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_legal_form_id_legal_forms_id_fk" FOREIGN KEY ("legal_form_id") REFERENCES "public"."legal_forms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_contacts" ADD CONSTRAINT "supplier_contacts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_contacts" ADD CONSTRAINT "supplier_contacts_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "suppliers_company_id_idx" ON "suppliers" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "suppliers_siret_idx" ON "suppliers" USING btree ("siret");--> statement-breakpoint
CREATE INDEX "suppliers_business_name_idx" ON "suppliers" USING btree ("business_name");--> statement-breakpoint
CREATE INDEX "supplier_contacts_company_id_idx" ON "supplier_contacts" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "supplier_contacts_supplier_id_idx" ON "supplier_contacts" USING btree ("supplier_id");