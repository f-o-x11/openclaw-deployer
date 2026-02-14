import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * OpenClaw bot instances - stores configuration and process metadata
 */
export const bots = mysqlTable("bots", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Owner of the bot
  
  // Bot configuration
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  personalityTraits: text("personalityTraits"), // JSON array of traits
  behavioralGuidelines: text("behavioralGuidelines"),
  systemPrompt: text("systemPrompt"), // Generated system prompt for OpenClaw
  
  // Process management
  processId: varchar("processId", { length: 255 }), // Docker container ID
  port: int("port"), // Assigned port for this instance
  status: mysqlEnum("status", ["stopped", "starting", "running", "crashed", "stopping"]).default("stopped").notNull(),
  configPath: varchar("configPath", { length: 512 }), // Path to openclaw.json
  
  // Messaging channels
  whatsappEnabled: boolean("whatsappEnabled").default(false),
  whatsappQrCode: text("whatsappQrCode"), // QR code data URL
  whatsappPaired: boolean("whatsappPaired").default(false),
  
  telegramEnabled: boolean("telegramEnabled").default(false),
  telegramBotToken: varchar("telegramBotToken", { length: 255 }),
  telegramBotUsername: varchar("telegramBotUsername", { length: 255 }),
  
  // Metadata
  lastStartedAt: timestamp("lastStartedAt"),
  lastStoppedAt: timestamp("lastStoppedAt"),
  crashCount: int("crashCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Bot = typeof bots.$inferSelect;
export type InsertBot = typeof bots.$inferInsert;

/**
 * Process logs from OpenClaw instances
 */
export const processLogs = mysqlTable("process_logs", {
  id: int("id").autoincrement().primaryKey(),
  botId: int("botId").notNull(),
  logType: mysqlEnum("logType", ["stdout", "stderr", "system"]).notNull(),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type ProcessLog = typeof processLogs.$inferSelect;
export type InsertProcessLog = typeof processLogs.$inferInsert;
