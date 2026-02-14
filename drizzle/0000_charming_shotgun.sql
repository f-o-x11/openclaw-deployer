CREATE TYPE "public"."logType" AS ENUM('stdout', 'stderr', 'system');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('stopped', 'starting', 'running', 'crashed', 'stopping');--> statement-breakpoint
CREATE TABLE "bots" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"personalityTraits" text,
	"behavioralGuidelines" text,
	"systemPrompt" text,
	"processId" varchar(255),
	"port" integer,
	"status" "status" DEFAULT 'stopped' NOT NULL,
	"configPath" varchar(512),
	"whatsappEnabled" boolean DEFAULT false,
	"whatsappQrCode" text,
	"whatsappPaired" boolean DEFAULT false,
	"telegramEnabled" boolean DEFAULT false,
	"telegramBotToken" varchar(255),
	"telegramBotUsername" varchar(255),
	"lastStartedAt" timestamp,
	"lastStoppedAt" timestamp,
	"crashCount" integer DEFAULT 0,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "process_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"botId" integer NOT NULL,
	"logType" "logType" NOT NULL,
	"content" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64),
	"name" text,
	"email" varchar(320),
	"password" varchar(255),
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
