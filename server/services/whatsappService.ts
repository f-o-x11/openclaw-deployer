import pkg from "whatsapp-web.js";
const { Client, LocalAuth } = pkg;
import QRCode from "qrcode";
import { getDb } from "../db";
import { bots } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

// Store active WhatsApp clients
const whatsappClients = new Map<number, any>();

/**
 * Initialize WhatsApp client for a bot and generate QR code
 */
export async function initializeWhatsAppClient(
  botId: number
): Promise<{ qrCode: string | null; status: string }> {
  // Check if client already exists
  if (whatsappClients.has(botId)) {
    const client = whatsappClients.get(botId)!;
    const state = await client.getState();
    return {
      qrCode: null,
      status: state || "initializing",
    };
  }

  // Create new client
  const client = new Client({
    authStrategy: new LocalAuth({
      clientId: `bot-${botId}`,
      dataPath: `/home/ubuntu/whatsapp-sessions/bot-${botId}`,
    }),
    puppeteer: {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
  });

  let qrCodeData: string | null = null;

  // Handle QR code generation
  client.on("qr", async (qr) => {
    console.log(`[WhatsApp Bot ${botId}] QR Code generated`);
    
    // Generate QR code as data URL
    qrCodeData = await QRCode.toDataURL(qr);

    // Store in database
    const db = await getDb();
    if (db) {
      await db
        .update(bots)
        .set({
          whatsappQrCode: qrCodeData,
          whatsappPaired: false,
        })
        .where(eq(bots.id, botId));
    }
  });

  // Handle successful authentication
  client.on("ready", async () => {
    console.log(`[WhatsApp Bot ${botId}] Client is ready!`);

    const db = await getDb();
    if (db) {
      await db
        .update(bots)
        .set({
          whatsappPaired: true,
          whatsappQrCode: null, // Clear QR code after pairing
        })
        .where(eq(bots.id, botId));
    }
  });

  // Handle authentication failure
  client.on("auth_failure", async (msg) => {
    console.error(`[WhatsApp Bot ${botId}] Authentication failure:`, msg);
    
    const db = await getDb();
    if (db) {
      await db
        .update(bots)
        .set({
          whatsappPaired: false,
          whatsappQrCode: null,
        })
        .where(eq(bots.id, botId));
    }
  });

  // Handle disconnection
  client.on("disconnected", async (reason) => {
    console.log(`[WhatsApp Bot ${botId}] Client disconnected:`, reason);
    whatsappClients.delete(botId);

    const db = await getDb();
    if (db) {
      await db
        .update(bots)
        .set({
          whatsappPaired: false,
        })
        .where(eq(bots.id, botId));
    }
  });

  // Store client
  whatsappClients.set(botId, client);

  // Initialize client
  await client.initialize();

  return {
    qrCode: qrCodeData,
    status: "initializing",
  };
}

/**
 * Get WhatsApp client status for a bot
 */
export async function getWhatsAppStatus(botId: number): Promise<{
  connected: boolean;
  qrCode: string | null;
  status: string;
}> {
  const db = await getDb();
  if (!db) {
    return { connected: false, qrCode: null, status: "error" };
  }

  const [bot] = await db
    .select()
    .from(bots)
    .where(eq(bots.id, botId))
    .limit(1);

  if (!bot) {
    return { connected: false, qrCode: null, status: "not_found" };
  }

  const client = whatsappClients.get(botId);
  
  if (!client) {
    return {
      connected: false,
      qrCode: bot.whatsappQrCode,
      status: "not_initialized",
    };
  }

  const state = await client.getState();

  return {
    connected: bot.whatsappPaired || false,
    qrCode: bot.whatsappQrCode,
    status: state || "unknown",
  };
}

/**
 * Disconnect WhatsApp client for a bot
 */
export async function disconnectWhatsApp(botId: number): Promise<void> {
  const client = whatsappClients.get(botId);
  
  if (client) {
    await client.destroy();
    whatsappClients.delete(botId);
  }

  const db = await getDb();
  if (db) {
    await db
      .update(bots)
      .set({
        whatsappPaired: false,
        whatsappQrCode: null,
      })
      .where(eq(bots.id, botId));
  }
}

/**
 * Get WhatsApp client for sending messages
 */
export function getWhatsAppClient(botId: number): any | undefined {
  return whatsappClients.get(botId);
}
