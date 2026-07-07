CREATE TABLE "development"."scan_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"device_id" text NOT NULL,
	"image_url" text,
	"detected_book_ids" integer[] NOT NULL,
	"created_at" timestamp DEFAULT now()
);