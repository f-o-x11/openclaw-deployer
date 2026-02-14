import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json } from "drizzle-orm/mysql-core";

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
 * OpenClaw bots table - stores bot configurations and persona details
 */
export const bots = mysqlTable("bots", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Owner of the bot
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  personalityTraits: json("personalityTraits").$type<string[]>(), // Array of personality traits
  behavioralGuidelines: text("behavioralGuidelines"),
  status: mysqlEnum("status", ["draft", "configuring", "active", "paused", "error"]).default("draft").notNull(),
  configFileUrl: text("configFileUrl"), // S3 URL for OpenClaw config file
  deploymentMetadata: json("deploymentMetadata").$type<Record<string, any>>(), // Deployment-specific data
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Bot = typeof bots.$inferSelect;
export type InsertBot = typeof bots.$inferInsert;

/**
 * Messaging channels table - stores WhatsApp/Telegram credentials and connection status
 */
export const messagingChannels = mysqlTable("messaging_channels", {
  id: int("id").autoincrement().primaryKey(),
  botId: int("botId").notNull(), // Associated bot
  channelType: mysqlEnum("channelType", ["whatsapp", "telegram", "slack"]).notNull(),
  
  // WhatsApp specific fields
  whatsappQrCodeUrl: text("whatsappQrCodeUrl"), // S3 URL for QR code image
  whatsappSessionData: text("whatsappSessionData"), // Encrypted session data
  whatsappPaired: boolean("whatsappPaired").default(false),
  
  // Telegram specific fields
  telegramBotToken: text("telegramBotToken"), // Encrypted bot token
  telegramBotUsername: varchar("telegramBotUsername", { length: 255 }),
  telegramConnected: boolean("telegramConnected").default(false),
  
  // Common fields
  webhookUrl: text("webhookUrl"), // Webhook endpoint for this channel
  connectionStatus: mysqlEnum("connectionStatus", ["pending", "connected", "disconnected", "error"]).default("pending").notNull(),
  lastConnectedAt: timestamp("lastConnectedAt"),
  errorMessage: text("errorMessage"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MessagingChannel = typeof messagingChannels.$inferSelect;
export type InsertMessagingChannel = typeof messagingChannels.$inferInsert;

/**
 * Chat messages table - stores conversation history
 */
export const chatMessages = mysqlTable("chat_messages", {
  id: int("id").autoincrement().primaryKey(),
  botId: int("botId").notNull(),
  channelId: int("channelId"), // Optional: which channel this message came from
  
  // Message details
  messageType: mysqlEnum("messageType", ["user", "bot", "system"]).notNull(),
  content: text("content").notNull(),
  
  // Sender information
  senderName: varchar("senderName", { length: 255 }),
  senderIdentifier: varchar("senderIdentifier", { length: 255 }), // Phone number, Telegram ID, etc.
  
  // Metadata
  metadata: json("metadata").$type<Record<string, any>>(), // Additional message data
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

/**
 * Bot analytics table - stores usage metrics and statistics
 */
export const botAnalytics = mysqlTable("bot_analytics", {
  id: int("id").autoincrement().primaryKey(),
  botId: int("botId").notNull(),
  
  // Metrics
  totalMessages: int("totalMessages").default(0).notNull(),
  totalConversations: int("totalConversations").default(0).notNull(),
  averageResponseTime: int("averageResponseTime").default(0), // in milliseconds
  uptime: int("uptime").default(0), // in seconds
  
  // Timestamps
  lastMessageAt: timestamp("lastMessageAt"),
  recordedAt: timestamp("recordedAt").defaultNow().notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BotAnalytics = typeof botAnalytics.$inferSelect;
export type InsertBotAnalytics = typeof botAnalytics.$inferInsert;
