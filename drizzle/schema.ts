import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, serial, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  password: varchar("password", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * OpenClaw bot instances - stores configuration and process metadata
 */
export const bots = mysqlTable("bots", {
  id: serial("id").primaryKey(),
  userId: int("userId").notNull(), // Owner of the bot
  
  // Bot configuration
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  personalityTraits: text("personalityTraits"), // JSON array of traits
  behavioralGuidelines: text("behavioralGuidelines"),
  systemPrompt: text("systemPrompt"), // Generated system prompt for OpenClaw
  
  // Process management (kept for compatibility)
  processId: varchar("processId", { length: 255 }),
  port: int("port"),
  status: mysqlEnum("status", ["stopped", "starting", "running", "crashed", "stopping"]).default("stopped").notNull(),
  configPath: varchar("configPath", { length: 512 }),
  
  // Conway VM reference (links to conwayDeployments table)
  conwayDeploymentId: int("conwayDeploymentId"),
  
  // Messaging channels
  whatsappEnabled: boolean("whatsappEnabled").default(false),
  whatsappQrCode: text("whatsappQrCode"),
  whatsappPaired: boolean("whatsappPaired").default(false),
  
  telegramEnabled: boolean("telegramEnabled").default(false),
  telegramBotToken: varchar("telegramBotToken", { length: 255 }),
  telegramBotUsername: varchar("telegramBotUsername", { length: 255 }),
  
  // Metadata
  lastStartedAt: timestamp("lastStartedAt"),
  lastStoppedAt: timestamp("lastStoppedAt"),
  crashCount: int("crashCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Bot = typeof bots.$inferSelect;
export type InsertBot = typeof bots.$inferInsert;

/**
 * Conway VM deployment records — tracks the full lifecycle of a Conway Cloud
 * sandbox provisioned for an OpenClaw agent.
 *
 * Each row represents one sandbox. The provisioning pipeline moves through:
 *   pending → provisioning → initializing → configuring → launching → running
 * Failures at any step set the status to "failed".
 */
export const conwayDeployments = mysqlTable("conway_deployments", {
  id: serial("id").primaryKey(),
  botId: int("botId").notNull(),

  // Conway sandbox identity
  sandboxId: varchar("sandboxId", { length: 255 }),       // Conway API sandbox ID
  sandboxName: varchar("sandboxName", { length: 255 }),    // Human-readable name
  region: varchar("region", { length: 64 }).default("us-east").notNull(),

  // Resource allocation
  vcpu: int("vcpu").default(1).notNull(),
  memoryMb: int("memoryMb").default(1024).notNull(),
  diskGb: int("diskGb").default(5).notNull(),

  // Provisioning pipeline status
  status: mysqlEnum("conway_status", [
    "pending",        // Queued, not yet started
    "provisioning",   // POST /v1/sandboxes sent
    "initializing",   // Installing Conway Terminal + cloning OpenClaw
    "configuring",    // Uploading agent config.json
    "launching",      // Starting the agent process (pm2)
    "running",        // Agent is live
    "stopped",        // Manually stopped
    "failed",         // Error at any step
    "terminated",     // Sandbox deleted
  ]).default("pending").notNull(),

  // Pipeline step tracking
  currentStep: int("currentStep").default(0).notNull(),        // 0-4 maps to the 4 provisioning steps
  totalSteps: int("totalSteps").default(4).notNull(),
  stepDescription: varchar("stepDescription", { length: 512 }),

  // Networking
  publicUrl: varchar("publicUrl", { length: 512 }),            // Exposed gateway URL
  publicPort: int("publicPort"),
  ipAddress: varchar("ipAddress", { length: 64 }),

  // Agent configuration snapshot (JSON blob of the config injected into the VM)
  agentConfig: text("agentConfig"),

  // Buyer / onboarding metadata
  buyerEmail: varchar("buyerEmail", { length: 320 }),
  buyerName: varchar("buyerName", { length: 255 }),
  onboardingFormData: text("onboardingFormData"),               // Full form submission JSON

  // Error tracking
  lastError: text("lastError"),
  retryCount: int("retryCount").default(0).notNull(),

  // Timestamps
  provisionedAt: timestamp("provisionedAt"),
  initializedAt: timestamp("initializedAt"),
  launchedAt: timestamp("launchedAt"),
  stoppedAt: timestamp("stoppedAt"),
  terminatedAt: timestamp("terminatedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type ConwayDeployment = typeof conwayDeployments.$inferSelect;
export type InsertConwayDeployment = typeof conwayDeployments.$inferInsert;

/**
 * Chat messages for bot conversations
 */
export const messages = mysqlTable("messages", {
  id: serial("id").primaryKey(),
  botId: int("botId").notNull(),
  role: varchar("role", { length: 20 }).notNull(), // "user", "assistant", "system"
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatMessage = typeof messages.$inferSelect;
export type InsertChatMessage = typeof messages.$inferInsert;

/**
 * Process logs from OpenClaw instances
 */
export const processLogs = mysqlTable("process_logs", {
  id: serial("id").primaryKey(),
  botId: int("botId").notNull(),
  logType: mysqlEnum("logType", ["stdout", "stderr", "system"]).notNull(),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type ProcessLog = typeof processLogs.$inferSelect;
export type InsertProcessLog = typeof processLogs.$inferInsert;
