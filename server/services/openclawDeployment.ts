import { spawn, ChildProcess } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import { updateBot, addProcessLog } from "../db";

const OPENCLAW_BASE_DIR = "/home/ubuntu/openclaw-instances";
const OPENCLAW_MASTER_DIR = "/home/ubuntu/openclaw-master";

// Track running processes
const runningProcesses = new Map<number, ChildProcess>();

/**
 * Initialize OpenClaw instances directory
 */
export async function initializeOpenClawEnvironment() {
  try {
    await fs.mkdir(OPENCLAW_BASE_DIR, { recursive: true });
    console.log("[OpenClaw] Environment initialized");
  } catch (error) {
    console.error("[OpenClaw] Failed to initialize environment:", error);
    throw error;
  }
}

/**
 * Copy pre-built OpenClaw from master directory to bot instance
 */
export async function copyOpenClawToInstance(botId: number): Promise<string> {
  const instanceDir = path.join(OPENCLAW_BASE_DIR, `bot-${botId}`);

  try {
    // Check if already exists
    try {
      await fs.access(instanceDir);
      console.log(`[OpenClaw] Instance directory already exists for bot ${botId}`);
      return instanceDir;
    } catch {
      // Directory doesn't exist, proceed with copy
    }

    console.log(`[OpenClaw] Copying pre-built OpenClaw for bot ${botId}...`);

    // Use cp -r to copy the entire master directory
    await new Promise<void>((resolve, reject) => {
      const copyProcess = spawn("cp", ["-r", OPENCLAW_MASTER_DIR, instanceDir]);

      copyProcess.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Copy failed with code ${code}`));
        }
      });

      copyProcess.on("error", (error) => {
        reject(error);
      });
    });

    console.log(`[OpenClaw] Pre-built OpenClaw copied successfully for bot ${botId}`);
    return instanceDir;
  } catch (error) {
    console.error(`[OpenClaw] Failed to copy OpenClaw for bot ${botId}:`, error);
    throw error;
  }
}

/**
 * No need to install dependencies - they're already in the copied directory
 * This function is kept for backwards compatibility but does nothing
 */
export async function installOpenClawDependencies(botId: number, instanceDir: string): Promise<void> {
  console.log(`[OpenClaw] Skipping npm install for bot ${botId} (using pre-built copy)`);
  // Dependencies are already installed in the master copy
  return Promise.resolve();
}

/**
 * Generate openclaw.json configuration file
 */
export async function generateOpenClawConfig(
  botId: number,
  instanceDir: string,
  config: {
    name: string;
    systemPrompt: string;
    port: number;
    whatsappEnabled: boolean;
    telegramEnabled: boolean;
    telegramBotToken?: string | null;
  }
): Promise<string> {
  const configPath = path.join(instanceDir, "openclaw.json");

  const openclawConfig = {
    name: config.name,
    systemPrompt: config.systemPrompt,
    gateway: {
      port: config.port,
      host: "0.0.0.0",
    },
    channels: [] as any[],
    model: {
      provider: "manus",
      model: "default",
    },
  };

  // Add messaging channels
  if (config.whatsappEnabled) {
    openclawConfig.channels.push({
      type: "whatsapp",
      enabled: true,
    });
  }

  if (config.telegramEnabled && config.telegramBotToken) {
    openclawConfig.channels.push({
      type: "telegram",
      enabled: true,
      token: config.telegramBotToken,
    });
  }

  try {
    await fs.writeFile(configPath, JSON.stringify(openclawConfig, null, 2));
    console.log(`[OpenClaw] Configuration file created for bot ${botId}`);
    return configPath;
  } catch (error) {
    console.error(`[OpenClaw] Failed to create config for bot ${botId}:`, error);
    throw error;
  }
}

/**
 * Allocate a unique port for the bot instance
 */
export function allocatePort(botId: number): number {
  // Start from port 9000 and increment by bot ID
  return 9000 + botId;
}

/**
 * Start OpenClaw gateway process
 */
export async function startOpenClawProcess(
  botId: number,
  instanceDir: string,
  port: number
): Promise<number> {
  try {
    // Stop existing process if running
    await stopOpenClawProcess(botId);

    console.log(`[OpenClaw] Starting gateway for bot ${botId} on port ${port}...`);

    const gatewayProcess = spawn(process.execPath, ["scripts/run-node.mjs", "gateway"], {
      cwd: instanceDir,
      detached: true,
      stdio: ["ignore", "pipe", "pipe"],
    });

    const pid = gatewayProcess.pid;

    if (!pid) {
      throw new Error("Failed to get process ID");
    }

    // Store process reference
    runningProcesses.set(botId, gatewayProcess);

    // Capture stdout
    gatewayProcess.stdout?.on("data", async (data) => {
      const logContent = data.toString();
      console.log(`[Bot ${botId}] ${logContent}`);
      await addProcessLog({
        botId,
        logType: "stdout",
        content: logContent,
      });
    });

    // Capture stderr
    gatewayProcess.stderr?.on("data", async (data) => {
      const logContent = data.toString();
      console.error(`[Bot ${botId} ERROR] ${logContent}`);
      await addProcessLog({
        botId,
        logType: "stderr",
        content: logContent,
      });
    });

    // Handle process exit
    gatewayProcess.on("exit", async (code, signal) => {
      console.log(`[OpenClaw] Process for bot ${botId} exited with code ${code}, signal ${signal}`);
      runningProcesses.delete(botId);

      await addProcessLog({
        botId,
        logType: "system",
        content: `Process exited with code ${code}, signal ${signal}`,
      });

      // Update bot status
      if (code !== 0) {
        await updateBot(botId, {
          status: "crashed",
          crashCount: (await import("../db").then(m => m.getBotById(botId)))?.crashCount || 0 + 1,
        });
      } else {
        await updateBot(botId, { status: "stopped" });
      }
    });

    // Update database
    await updateBot(botId, {
      processId: String(pid),
      port,
      status: "running",
      lastStartedAt: new Date(),
    });

    await addProcessLog({
      botId,
      logType: "system",
      content: `OpenClaw gateway started on port ${port} with PID ${pid}`,
    });

    console.log(`[OpenClaw] Gateway started for bot ${botId} with PID ${pid}`);
    return pid;
  } catch (error) {
    console.error(`[OpenClaw] Failed to start process for bot ${botId}:`, error);
    await updateBot(botId, { status: "crashed" });
    throw error;
  }
}

/**
 * Stop OpenClaw process
 */
export async function stopOpenClawProcess(botId: number): Promise<void> {
  const process = runningProcesses.get(botId);

  if (process && !process.killed) {
    try {
      console.log(`[OpenClaw] Stopping process for bot ${botId}...`);
      process.kill("SIGTERM");

      // Wait for graceful shutdown
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Force kill if still running
      if (!process.killed) {
        process.kill("SIGKILL");
      }

      runningProcesses.delete(botId);

      await updateBot(botId, {
        status: "stopped",
        lastStoppedAt: new Date(),
      });

      await addProcessLog({
        botId,
        logType: "system",
        content: "Process stopped",
      });

      console.log(`[OpenClaw] Process stopped for bot ${botId}`);
    } catch (error) {
      console.error(`[OpenClaw] Failed to stop process for bot ${botId}:`, error);
      throw error;
    }
  }
}

/**
 * Restart OpenClaw process
 */
export async function restartOpenClawProcess(botId: number, instanceDir: string, port: number): Promise<void> {
  await stopOpenClawProcess(botId);
  await new Promise((resolve) => setTimeout(resolve, 1000));
  await startOpenClawProcess(botId, instanceDir, port);
}

/**
 * Check if process is running
 */
export function isProcessRunning(botId: number): boolean {
  const process = runningProcesses.get(botId);
  return !!process && !process.killed;
}

/**
 * Clean up bot instance (delete files and stop process)
 */
export async function cleanupBotInstance(botId: number): Promise<void> {
  try {
    // Stop process
    await stopOpenClawProcess(botId);

    // Delete instance directory
    const instanceDir = path.join(OPENCLAW_BASE_DIR, `bot-${botId}`);
    await fs.rm(instanceDir, { recursive: true, force: true });

    console.log(`[OpenClaw] Cleaned up instance for bot ${botId}`);
  } catch (error) {
    console.error(`[OpenClaw] Failed to cleanup instance for bot ${botId}:`, error);
    throw error;
  }
}
