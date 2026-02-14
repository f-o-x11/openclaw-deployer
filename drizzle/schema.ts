import { integer, pgEnum, pgTable, text, timestamp, varchar, boolean, serial } from "drizzle-orm/pg-core";

/**
 * Enums
 */
export const roleEnum = pgEnum("role", ["user", "admin"]);
export const statusEnum = pgEnum("status", ["stopped", "starting", "running", "crashed", "stopping"]);
export const logTypeEnum = pgEnum("logType", ["stdout", "stderr", "system"]);

/**
 * Core user table backing auth flow.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  password: varchar("password", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * OpenClaw bot instances - stores configuration and process metadata
 */
export const bots = pgTable("bots", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(), // Owner of the bot
  
  // Bot configuration
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  personalityTraits: text("personalityTraits"), // JSON array of traits
  behavioralGuidelines: text("behavioralGuidelines"),
  systemPrompt: text("systemPrompt"), // Generated system prompt for OpenClaw
  
  // Process management
  processId: varchar("processId", { length: 255 }), // Docker container ID
  port: integer("port"), // Assigned port for this instance
  status: statusEnum("status").default("stopped").notNull(),
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
  crashCount: integer("crashCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Bot = typeof bots.$inferSelect;
export type InsertBot = typeof bots.$inferInsert;

/**
 * Process logs from OpenClaw instances
 */
export const processLogs = pgTable("process_logs", {
  id: serial("id").primaryKey(),
  botId: integer("botId").notNull(),
  logType: logTypeEnum("logType").notNull(),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type ProcessLog = typeof processLogs.$inferSelect;
export type InsertProcessLog = typeof processLogs.$inferInsert;
