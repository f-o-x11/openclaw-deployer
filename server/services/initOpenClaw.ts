import { spawn } from "child_process";
import { promises as fs } from "fs";
import path from "path";

const OPENCLAW_MASTER_DIR = "/home/ubuntu/openclaw-master";

/**
 * Clone and build OpenClaw master copy (run once on server startup)
 */
export async function initializeOpenClaw(): Promise<void> {
  try {
    // Check if already cloned
    try {
      await fs.access(OPENCLAW_MASTER_DIR);
      console.log("[OpenClaw Init] Master directory already exists, skipping clone");
      return;
    } catch {
      // Directory doesn't exist, proceed with clone
    }

    console.log("[OpenClaw Init] Cloning OpenClaw repository...");
    
    // Clone repository
    await runCommand("git", [
      "clone",
      "https://github.com/openclaw/openclaw.git",
      OPENCLAW_MASTER_DIR,
    ]);

    console.log("[OpenClaw Init] Installing dependencies...");
    
    // Install dependencies
    await runCommand("pnpm", ["install"], { cwd: OPENCLAW_MASTER_DIR });

    console.log("[OpenClaw Init] Building OpenClaw...");
    
    // Build
    await runCommand("pnpm", ["build"], { cwd: OPENCLAW_MASTER_DIR });

    console.log("[OpenClaw Init] ✅ OpenClaw master copy ready");
  } catch (error) {
    console.error("[OpenClaw Init] ❌ Failed to initialize OpenClaw:", error);
    // Don't throw - allow server to start even if OpenClaw init fails
    // Deployments will fail with a clear error message
  }
}

/**
 * Helper to run shell commands
 */
function runCommand(
  command: string,
  args: string[],
  options?: { cwd?: string }
): Promise<void> {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, {
      cwd: options?.cwd,
      stdio: "inherit",
    });

    process.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} failed with code ${code}`));
      }
    });

    process.on("error", (error) => {
      reject(error);
    });
  });
}
