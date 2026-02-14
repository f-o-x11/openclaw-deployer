import { eq, desc, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { InsertUser, users, bots, InsertBot, processLogs, InsertProcessLog, messages, InsertChatMessage } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: any = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const pool = mysql.createPool(process.env.DATABASE_URL);
      _db = drizzle(pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

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
    // Check if user exists
    const existing = await db.select().from(users).where(eq(users.openId, user.openId)).limit(1);

    if (existing.length > 0) {
      // Update existing user
      const updateSet: Record<string, unknown> = {};
      const textFields = ["name", "email", "loginMethod"] as const;
      type TextField = (typeof textFields)[number];

      const assignNullable = (field: TextField) => {
        const value = user[field];
        if (value === undefined) return;
        const normalized = value ?? null;
        updateSet[field] = normalized;
      };

      textFields.forEach(assignNullable);

      if (user.lastSignedIn !== undefined) {
        updateSet.lastSignedIn = user.lastSignedIn;
      }
      if (user.role !== undefined) {
        updateSet.role = user.role;
      }

      if (Object.keys(updateSet).length === 0) {
        updateSet.lastSignedIn = new Date();
      }

      await db.update(users).set(updateSet).where(eq(users.openId, user.openId));
    } else {
      // Insert new user
      const values: InsertUser = {
        openId: user.openId,
        name: user.name ?? null,
        email: user.email ?? null,
        loginMethod: user.loginMethod ?? null,
        lastSignedIn: user.lastSignedIn ?? new Date(),
        role: user.role ?? (user.openId === ENV.ownerOpenId ? 'admin' : 'user'),
      };

      await db.insert(users).values(values);
    }
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

// Bot management queries
export async function createBot(bot: InsertBot) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(bots).values(bot);
  // MySQL returns insertId
  const insertId = Number(result[0].insertId);
  const inserted = await db.select().from(bots).where(eq(bots.id, insertId)).limit(1);
  return inserted;
}

export async function getBotsByUserId(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(bots).where(eq(bots.userId, userId));
}

export async function getAllBots() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(bots).orderBy(desc(bots.createdAt));
}

export async function getBotById(botId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(bots).where(eq(bots.id, botId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateBot(botId: number, updates: Partial<InsertBot>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(bots).set(updates).where(eq(bots.id, botId));
}

export async function deleteBot(botId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Delete associated messages first
  await db.delete(messages).where(eq(messages.botId, botId));
  // Delete associated logs
  await db.delete(processLogs).where(eq(processLogs.botId, botId));
  // Delete the bot
  await db.delete(bots).where(eq(bots.id, botId));
}

// Chat message queries
export async function addChatMessage(msg: InsertChatMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(messages).values(msg);
  const insertId = Number(result[0].insertId);
  const inserted = await db.select().from(messages).where(eq(messages.id, insertId)).limit(1);
  return inserted[0];
}

export async function getChatMessages(botId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(messages)
    .where(eq(messages.botId, botId))
    .orderBy(asc(messages.createdAt))
    .limit(limit);
}

export async function clearChatMessages(botId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(messages).where(eq(messages.botId, botId));
}

// Process log queries
export async function addProcessLog(log: InsertProcessLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(processLogs).values(log);
}

export async function getProcessLogs(botId: number, limit: number = 100) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(processLogs)
    .where(eq(processLogs.botId, botId))
    .orderBy(processLogs.timestamp)
    .limit(limit);
}
