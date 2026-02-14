import Docker from "dockerode";
import { getDb } from "../db";
import { bots } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { storagePut } from "../storage";

const docker = new Docker({ socketPath: "/var/run/docker.sock" });

const OPENCLAW_IMAGE = "openclaw-deployer/openclaw:latest";
const BASE_PORT = 9000;

/**
 * Build the OpenClaw base image (run once on startup)
 */
export async function buildOpenClawImage(): Promise<void> {
  console.log("[Docker] Building OpenClaw base image...");
  
  try {
    const stream = await docker.buildImage(
      {
        context: "/home/ubuntu/openclaw_deployer/docker/openclaw",
        src: ["Dockerfile"],
      },
      {
        t: OPENCLAW_IMAGE,
      }
    );

    await new Promise((resolve, reject) => {
      docker.modem.followProgress(stream, (err: Error | null, res: any) =>
        err ? reject(err) : resolve(res)
      );
    });

    console.log("[Docker] OpenClaw base image built successfully");
  } catch (error) {
    console.error("[Docker] Failed to build OpenClaw image:", error);
    throw error;
  }
}

/**
 * Generate openclaw.json configuration for a bot
 */
async function generateOpenClawConfig(
  botId: number,
  botName: string,
  personality: string,
  guidelines: string,
  channels: { whatsapp?: boolean; telegram?: boolean }
): Promise<string> {
  const config = {
    gateway: {
      port: BASE_PORT + botId,
      host: "0.0.0.0",
    },
    bot: {
      name: botName,
      personality,
      guidelines,
    },
    channels: {
      ...(channels.whatsapp && {
        whatsapp: {
          enabled: true,
          qrCode: true,
        },
      }),
      ...(channels.telegram && {
        telegram: {
          enabled: true,
        },
      }),
    },
    model: {
      provider: "custom",
      endpoint: process.env.BUILT_IN_FORGE_API_URL + "/llm/chat",
      apiKey: process.env.BUILT_IN_FORGE_API_KEY,
    },
  };

  const configJson = JSON.stringify(config, null, 2);
  
  // Upload config to S3
  const { url } = await storagePut(
    `bot-configs/bot-${botId}/openclaw.json`,
    configJson,
    "application/json"
  );

  return url;
}

/**
 * Deploy a bot by creating a Docker container
 */
export async function deployBot(botId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [bot] = await db.select().from(bots).where(eq(bots.id, Number(botId))).limit(1);
  if (!bot) throw new Error(`Bot ${botId} not found`);

  console.log(`[Docker] Deploying bot ${botId}...`);

  // Generate configuration
  const configUrl = await generateOpenClawConfig(
    botId,
    bot.name,
    bot.personalityTraits || "helpful, friendly",
    bot.systemPrompt || "You are a helpful assistant",
    {
      whatsapp: bot.whatsappEnabled ?? false,
      telegram: bot.telegramEnabled ?? false,
    }
  );

  // Create Docker container
  const port = BASE_PORT + botId;
  const containerName = `openclaw-bot-${botId}`;

  try {
    const container = await docker.createContainer({
      Image: OPENCLAW_IMAGE,
      name: containerName,
      Env: [
        `BOT_ID=${botId}`,
        `CONFIG_URL=${configUrl}`,
        `FORGE_API_URL=${process.env.BUILT_IN_FORGE_API_URL}`,
        `FORGE_API_KEY=${process.env.BUILT_IN_FORGE_API_KEY}`,
      ],
      ExposedPorts: {
        "8080/tcp": {},
      },
      HostConfig: {
        PortBindings: {
          "8080/tcp": [{ HostPort: port.toString() }],
        },
        RestartPolicy: {
          Name: "unless-stopped",
        },
      },
    });

    // Update database with container info
    await db
      .update(bots)
      .set({
        configPath: configUrl,
        port,
        processId: container.id,
        status: "stopped",
      })
      .where(eq(bots.id, Number(botId)));

    console.log(`[Docker] Bot ${botId} deployed with container ${container.id}`);
  } catch (error) {
    console.error(`[Docker] Failed to deploy bot ${botId}:`, error);
    throw error;
  }
}

/**
 * Start a bot container
 */
export async function startBot(botId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [bot] = await db.select().from(bots).where(eq(bots.id, Number(botId))).limit(1);
  if (!bot || !bot.processId) throw new Error(`Bot ${botId} not deployed`);

  console.log(`[Docker] Starting bot ${botId}...`);

  try {
    const container = docker.getContainer(bot.processId);
    await container.start();

    await db
      .update(bots)
      .set({ status: "running" })
      .where(eq(bots.id, Number(botId)));

    console.log(`[Docker] Bot ${botId} started`);
  } catch (error) {
    console.error(`[Docker] Failed to start bot ${botId}:`, error);
    throw error;
  }
}

/**
 * Stop a bot container
 */
export async function stopBot(botId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [bot] = await db.select().from(bots).where(eq(bots.id, Number(botId))).limit(1);
  if (!bot || !bot.processId) throw new Error(`Bot ${botId} not deployed`);

  console.log(`[Docker] Stopping bot ${botId}...`);

  try {
    const container = docker.getContainer(bot.processId);
    await container.stop();

    await db
      .update(bots)
      .set({ status: "stopped" })
      .where(eq(bots.id, Number(botId)));

    console.log(`[Docker] Bot ${botId} stopped`);
  } catch (error) {
    console.error(`[Docker] Failed to stop bot ${botId}:`, error);
    throw error;
  }
}

/**
 * Restart a bot container
 */
export async function restartBot(botId: number): Promise<void> {
  await stopBot(botId);
  await startBot(botId);
}

/**
 * Delete a bot and its container
 */
export async function deleteBot(botId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [bot] = await db.select().from(bots).where(eq(bots.id, Number(botId))).limit(1);
  if (!bot) return;

  console.log(`[Docker] Deleting bot ${botId}...`);

  try {
    if (bot.processId) {
      const container = docker.getContainer(bot.processId);
      
      // Stop if running
      try {
        await container.stop();
      } catch (e) {
        // Already stopped
      }

      // Remove container
      await container.remove();
    }

    console.log(`[Docker] Bot ${botId} container deleted`);
  } catch (error) {
    console.error(`[Docker] Failed to delete bot ${botId} container:`, error);
  }
}

/**
 * Get container logs
 */
export async function getBotLogs(botId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [bot] = await db.select().from(bots).where(eq(bots.id, Number(botId))).limit(1);
  if (!bot || !bot.processId) throw new Error(`Bot ${botId} not deployed`);

  try {
    const container = docker.getContainer(bot.processId);
    const logs = await container.logs({
      stdout: true,
      stderr: true,
      tail: 100,
    });

    return logs.toString();
  } catch (error) {
    console.error(`[Docker] Failed to get logs for bot ${botId}:`, error);
    throw error;
  }
}
