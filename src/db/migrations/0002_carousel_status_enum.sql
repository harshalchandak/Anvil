CREATE TYPE "public"."carousel_status" AS ENUM('pending', 'outlined', 'rendering', 'rendered', 'partial', 'published');--> statement-breakpoint
ALTER TABLE "carousels" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."carousel_status";--> statement-breakpoint
ALTER TABLE "carousels" ALTER COLUMN "status" SET DATA TYPE "public"."carousel_status" USING "status"::"public"."carousel_status";