CREATE TYPE "public"."messageRole" AS ENUM('user', 'assistant', 'system');--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"botId" integer NOT NULL,
	"role" "messageRole" NOT NULL,
	"content" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
