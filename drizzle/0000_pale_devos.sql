CREATE TABLE "drafts" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"hooks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"owner_user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outreach_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"target_company" text NOT NULL,
	"company_name_of_kb" text,
	"research_summary" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"owner_user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prospects" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"name" text NOT NULL,
	"role" text,
	"fit_reason" text,
	"is_selected" boolean DEFAULT false NOT NULL,
	"owner_user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "_users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "drafts_owner_idx" ON "drafts" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "drafts_session_idx" ON "drafts" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "outreach_sessions_owner_idx" ON "outreach_sessions" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "prospects_owner_idx" ON "prospects" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "prospects_session_idx" ON "prospects" USING btree ("session_id");--> statement-breakpoint
CREATE UNIQUE INDEX "_users_email_unique" ON "_users" USING btree ("email");