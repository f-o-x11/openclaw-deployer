import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  bots, 
  Bot, 
  InsertBot,
  messagingChannels,
  MessagingChannel,
  InsertMessagingChannel,
  chatMessages,
  ChatMessage,
  InsertChatMessage,
  botAnalytics,
  BotAnalytics,
  InsertBotAnalytics
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ==================== User Operations ====================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ==================== Bot Operations ====================

export async function createBot(bot: InsertBot): Promise<Bot | undefined> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create bot: database not available");
    return undefined;
  }

  try {
    const result = await db.insert(bots).values(bot);
    const insertId = Number(result[0].insertId);
    
    // Fetch and return the created bot
    const createdBot = await db.select().from(bots).where(eq(bots.id, insertId)).limit(1);
    return createdBot[0];
  } catch (error) {
    console.error("[Database] Failed to create bot:", error);
    throw error;
  }
}

export async function getBotById(botId: number): Promise<Bot | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(bots).where(eq(bots.id, botId)).limit(1);
  return result[0];
}

export async function getBotsByUserId(userId: number): Promise<Bot[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(bots).where(eq(bots.userId, userId)).orderBy(desc(bots.createdAt));
}

export async function updateBot(botId: number, updates: Partial<InsertBot>): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update bot: database not available");
    return;
  }

  try {
    await db.update(bots).set(updates).where(eq(bots.id, botId));
  } catch (error) {
    console.error("[Database] Failed to update bot:", error);
    throw error;
  }
}

export async function deleteBot(botId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete bot: database not available");
    return;
  }

  try {
    await db.delete(bots).where(eq(bots.id, botId));
  } catch (error) {
    console.error("[Database] Failed to delete bot:", error);
    throw error;
  }
}

// ==================== Messaging Channel Operations ====================

export async function createMessagingChannel(channel: InsertMessagingChannel): Promise<MessagingChannel | undefined> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create messaging channel: database not available");
    return undefined;
  }

  try {
    const result = await db.insert(messagingChannels).values(channel);
    const insertId = Number(result[0].insertId);
    
    const createdChannel = await db.select().from(messagingChannels).where(eq(messagingChannels.id, insertId)).limit(1);
    return createdChannel[0];
  } catch (error) {
    console.error("[Database] Failed to create messaging channel:", error);
    throw error;
  }
}

export async function getMessagingChannelsByBotId(botId: number): Promise<MessagingChannel[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(messagingChannels).where(eq(messagingChannels.botId, botId));
}

export async function updateMessagingChannel(channelId: number, updates: Partial<InsertMessagingChannel>): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update messaging channel: database not available");
    return;
  }

  try {
    await db.update(messagingChannels).set(updates).where(eq(messagingChannels.id, channelId));
  } catch (error) {
    console.error("[Database] Failed to update messaging channel:", error);
    throw error;
  }
}

// ==================== Chat Message Operations ====================

export async function createChatMessage(message: InsertChatMessage): Promise<ChatMessage | undefined> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create chat message: database not available");
    return undefined;
  }

  try {
    const result = await db.insert(chatMessages).values(message);
    const insertId = Number(result[0].insertId);
    
    const createdMessage = await db.select().from(chatMessages).where(eq(chatMessages.id, insertId)).limit(1);
    return createdMessage[0];
  } catch (error) {
    console.error("[Database] Failed to create chat message:", error);
    throw error;
  }
}

export async function getChatMessagesByBotId(botId: number, limit: number = 100): Promise<ChatMessage[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.botId, botId))
    .orderBy(desc(chatMessages.createdAt))
    .limit(limit);
}

// ==================== Bot Analytics Operations ====================

export async function upsertBotAnalytics(analytics: InsertBotAnalytics): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert bot analytics: database not available");
    return;
  }

  try {
    await db.insert(botAnalytics).values(analytics).onDuplicateKeyUpdate({
      set: analytics,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert bot analytics:", error);
    throw error;
  }
}

export async function getBotAnalyticsByBotId(botId: number): Promise<BotAnalytics | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(botAnalytics).where(eq(botAnalytics.botId, botId)).limit(1);
  return result[0];
}
