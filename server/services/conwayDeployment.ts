/**
 * Conway VM Auto-Provisioning Service
 *
 * Orchestrates the full lifecycle of deploying an OpenClaw agent onto a Conway
 * Cloud sandbox.  The pipeline has four sequential steps:
 *
 *   Step 1 — Provision:   Create the sandbox via Conway REST API
 *   Step 2 — Initialize:  Install Conway Terminal, clone & build OpenClaw
 *   Step 3 — Configure:   Upload the agent config.json derived from the bot
 *   Step 4 — Launch:      Start the agent with pm2 and expose the gateway port
 *
 * Each step updates the `conway_deployments` row so the frontend can show
 * real-time progress.  If any step fails, the deployment is marked "failed"
 * with the error message persisted for debugging.
 */

import { eq } from "drizzle-orm";
import { conwayClient, ConwayClient } from "./conwayClient";
import { getDb } from "../db";
import { conwayDeployments, bots } from "../../drizzle/schema";
import type { Bot, ConwayDeployment, InsertConwayDeployment } from "../../drizzle/schema";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OnboardingPayload {
  botId: number;
  buyerName?: string;
  buyerEmail?: string;
  /** Arbitrary key-value pairs from the AgentMart onboarding form. */
  formData?: Record<string, unknown>;
  /** Override default VM specs. */
  vcpu?: number;
  memoryMb?: number;
  diskGb?: number;
  region?: "us-east" | "eu-north";
}

export interface ProvisionResult {
  deploymentId: number;
  sandboxId: string | null;
  status: string;
  publicUrl: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function updateDeployment(
  deploymentId: number,
  patch: Partial<InsertConwayDeployment>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(conwayDeployments)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(conwayDeployments.id, deploymentId));
}

/**
 * Build the OpenClaw config.json that gets injected into the VM.
 * Mirrors the TOML structure expected by ZeroClaw but serialised as JSON
 * so the deployer can write it in a single API call.
 */
function buildAgentConfig(bot: Bot): string {
  const traits: string[] = bot.personalityTraits
    ? JSON.parse(bot.personalityTraits)
    : [];

  const config = {
    agent: {
      name: bot.name,
      system_prompt: bot.systemPrompt ?? "",
      personality_traits: traits,
      behavioral_guidelines: bot.behavioralGuidelines ?? "",
    },
    gateway: {
      host: "0.0.0.0",
      port: 8080,
    },
    channels: {
      webhook: { enabled: true },
      ...(bot.telegramEnabled && bot.telegramBotToken
        ? {
            telegram: {
              enabled: true,
              bot_token: bot.telegramBotToken,
            },
          }
        : {}),
    },
    model: {
      provider: "custom",
      endpoint: process.env.BUILT_IN_FORGE_API_URL
        ? `${process.env.BUILT_IN_FORGE_API_URL}/llm/chat`
        : "",
      api_key: process.env.BUILT_IN_FORGE_API_KEY ?? "",
    },
  };

  return JSON.stringify(config, null, 2);
}

// ---------------------------------------------------------------------------
// Pipeline Steps
// ---------------------------------------------------------------------------

/**
 * Step 1 — Provision the Conway sandbox.
 */
async function stepProvision(
  deploymentId: number,
  payload: OnboardingPayload
): Promise<string> {
  await updateDeployment(deploymentId, {
    status: "provisioning",
    currentStep: 1,
    stepDescription: "Creating Conway Cloud sandbox...",
  });

  const sandbox = await conwayClient.createSandbox({
    name: `openclaw-bot-${payload.botId}-${Date.now()}`,
    vcpu: payload.vcpu ?? 1,
    memory_mb: payload.memoryMb ?? 1024,
    disk_gb: payload.diskGb ?? 5,
    region: payload.region ?? "us-east",
  });

  // Wait until the sandbox is actually running before proceeding.
  const running = await conwayClient.waitForRunning(sandbox.id);

  await updateDeployment(deploymentId, {
    sandboxId: running.id,
    sandboxName: running.name,
    ipAddress: running.ip_address ?? null,
    provisionedAt: new Date(),
    stepDescription: "Sandbox provisioned successfully.",
  });

  return running.id;
}

/**
 * Step 2 — Initialize the environment inside the sandbox.
 *
 * Installs the Conway Terminal, clones the OpenClaw runtime, and builds it.
 */
async function stepInitialize(
  deploymentId: number,
  sandboxId: string
): Promise<void> {
  await updateDeployment(deploymentId, {
    status: "initializing",
    currentStep: 2,
    stepDescription: "Installing Conway Terminal & cloning OpenClaw runtime...",
  });

  // 2a — Install Conway Terminal
  const terminalResult = await conwayClient.exec(sandboxId, {
    command: "curl -fsSL https://conway.tech/terminal.sh | sh",
    timeout_seconds: 60,
  });
  if (terminalResult.exit_code !== 0) {
    throw new Error(
      `Conway Terminal install failed (exit ${terminalResult.exit_code}): ${terminalResult.stderr}`
    );
  }

  // 2b — Clone OpenClaw
  const cloneResult = await conwayClient.exec(sandboxId, {
    command: "git clone https://github.com/openclaw/openclaw.git /home/ubuntu/openclaw",
    timeout_seconds: 60,
  });
  if (cloneResult.exit_code !== 0) {
    throw new Error(
      `OpenClaw clone failed (exit ${cloneResult.exit_code}): ${cloneResult.stderr}`
    );
  }

  // 2c — Install dependencies & build
  const buildResult = await conwayClient.exec(sandboxId, {
    command: "cd /home/ubuntu/openclaw && pnpm install && pnpm build",
    timeout_seconds: 120,
  });
  if (buildResult.exit_code !== 0) {
    throw new Error(
      `OpenClaw build failed (exit ${buildResult.exit_code}): ${buildResult.stderr}`
    );
  }

  await updateDeployment(deploymentId, {
    initializedAt: new Date(),
    stepDescription: "OpenClaw runtime installed and built.",
  });
}

/**
 * Step 3 — Upload the agent configuration derived from the bot record and
 * the buyer's onboarding form data.
 */
async function stepConfigure(
  deploymentId: number,
  sandboxId: string,
  bot: Bot
): Promise<string> {
  await updateDeployment(deploymentId, {
    status: "configuring",
    currentStep: 3,
    stepDescription: "Injecting agent configuration...",
  });

  const configJson = buildAgentConfig(bot);

  // Ensure the config directory exists
  await conwayClient.exec(sandboxId, {
    command: "mkdir -p /home/ubuntu/.openclaw",
    timeout_seconds: 10,
  });

  // Upload config.json
  await conwayClient.uploadFile(sandboxId, {
    path: "/home/ubuntu/.openclaw/config.json",
    content: configJson,
    mode: "0644",
  });

  await updateDeployment(deploymentId, {
    agentConfig: configJson,
    stepDescription: "Agent configuration injected.",
  });

  return configJson;
}

/**
 * Step 4 — Launch the agent process and expose the gateway port.
 */
async function stepLaunch(
  deploymentId: number,
  sandboxId: string
): Promise<string | null> {
  await updateDeployment(deploymentId, {
    status: "launching",
    currentStep: 4,
    stepDescription: "Starting agent process and exposing gateway...",
  });

  // Install pm2 globally if not present, then start the agent
  await conwayClient.exec(sandboxId, {
    command: "npm install -g pm2 || true",
    timeout_seconds: 30,
  });

  const startResult = await conwayClient.exec(sandboxId, {
    command:
      'cd /home/ubuntu/openclaw && pm2 start "pnpm start" --name openclaw-agent',
    timeout_seconds: 30,
  });
  if (startResult.exit_code !== 0) {
    throw new Error(
      `Agent launch failed (exit ${startResult.exit_code}): ${startResult.stderr}`
    );
  }

  // Expose port 8080 (the OpenClaw gateway default)
  let publicUrl: string | null = null;
  try {
    const portResult = await conwayClient.exposePort(sandboxId, {
      port: 8080,
      protocol: "tcp",
    });
    publicUrl = portResult.public_url;
  } catch (err) {
    // Non-fatal — the agent still runs, just not publicly reachable yet
    console.warn(
      `[Conway] Port expose failed for sandbox ${sandboxId}:`,
      ConwayClient.formatError(err)
    );
  }

  await updateDeployment(deploymentId, {
    status: "running",
    publicUrl,
    publicPort: 8080,
    launchedAt: new Date(),
    stepDescription: "Agent is live.",
  });

  return publicUrl;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Run the full 4-step provisioning pipeline.
 *
 * This is the main entry point called by the tRPC router when an AgentMart
 * onboarding form is submitted (or when the "Deploy to Conway" button is
 * clicked in the dashboard).
 */
export async function provisionConwayVM(
  payload: OnboardingPayload
): Promise<ProvisionResult> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Resolve the bot
  const [bot] = await db
    .select()
    .from(bots)
    .where(eq(bots.id, payload.botId))
    .limit(1);
  if (!bot) throw new Error(`Bot ${payload.botId} not found`);

  // Create the deployment record
  const insertResult = await db.insert(conwayDeployments).values({
    botId: payload.botId,
    region: payload.region ?? "us-east",
    vcpu: payload.vcpu ?? 1,
    memoryMb: payload.memoryMb ?? 1024,
    diskGb: payload.diskGb ?? 5,
    status: "pending",
    currentStep: 0,
    totalSteps: 4,
    stepDescription: "Queued for provisioning.",
    buyerName: payload.buyerName ?? null,
    buyerEmail: payload.buyerEmail ?? null,
    onboardingFormData: payload.formData
      ? JSON.stringify(payload.formData)
      : null,
  } satisfies InsertConwayDeployment);

  const deploymentId = Number((insertResult as any)[0].insertId);

  // Link the deployment to the bot
  await db
    .update(bots)
    .set({ conwayDeploymentId: deploymentId, status: "starting" })
    .where(eq(bots.id, payload.botId));

  // Execute the pipeline — each step throws on failure
  let sandboxId: string | null = null;
  let publicUrl: string | null = null;

  try {
    sandboxId = await stepProvision(deploymentId, payload);
    await stepInitialize(deploymentId, sandboxId);
    await stepConfigure(deploymentId, sandboxId, bot);
    publicUrl = await stepLaunch(deploymentId, sandboxId);

    // Mark the bot as running
    await db
      .update(bots)
      .set({
        status: "running",
        processId: sandboxId,
        lastStartedAt: new Date(),
      })
      .where(eq(bots.id, payload.botId));

    return {
      deploymentId,
      sandboxId,
      status: "running",
      publicUrl,
    };
  } catch (err) {
    const errorMsg = ConwayClient.formatError(err);
    console.error(
      `[Conway] Provisioning failed for bot ${payload.botId}:`,
      errorMsg
    );

    await updateDeployment(deploymentId, {
      status: "failed",
      lastError: errorMsg,
      stepDescription: `Failed: ${errorMsg}`,
    });

    // Mark the bot as crashed
    await db
      .update(bots)
      .set({ status: "crashed" })
      .where(eq(bots.id, payload.botId));

    return {
      deploymentId,
      sandboxId,
      status: "failed",
      publicUrl: null,
    };
  }
}

/**
 * Stop a Conway-deployed agent.
 */
export async function stopConwayVM(deploymentId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [deployment] = await db
    .select()
    .from(conwayDeployments)
    .where(eq(conwayDeployments.id, deploymentId))
    .limit(1);

  if (!deployment || !deployment.sandboxId) {
    throw new Error(`Conway deployment ${deploymentId} not found or has no sandbox`);
  }

  await conwayClient.stopSandbox(deployment.sandboxId);

  await updateDeployment(deploymentId, {
    status: "stopped",
    stoppedAt: new Date(),
    stepDescription: "Sandbox stopped.",
  });

  // Update the linked bot
  await db
    .update(bots)
    .set({ status: "stopped", lastStoppedAt: new Date() })
    .where(eq(bots.id, deployment.botId));
}

/**
 * Restart a stopped Conway sandbox.
 */
export async function restartConwayVM(deploymentId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [deployment] = await db
    .select()
    .from(conwayDeployments)
    .where(eq(conwayDeployments.id, deploymentId))
    .limit(1);

  if (!deployment || !deployment.sandboxId) {
    throw new Error(`Conway deployment ${deploymentId} not found or has no sandbox`);
  }

  await conwayClient.startSandbox(deployment.sandboxId);

  // Re-launch the agent process inside the sandbox
  await conwayClient.exec(deployment.sandboxId, {
    command: 'cd /home/ubuntu/openclaw && pm2 restart openclaw-agent || pm2 start "pnpm start" --name openclaw-agent',
    timeout_seconds: 30,
  });

  await updateDeployment(deploymentId, {
    status: "running",
    launchedAt: new Date(),
    stepDescription: "Sandbox restarted.",
  });

  await db
    .update(bots)
    .set({ status: "running", lastStartedAt: new Date() })
    .where(eq(bots.id, deployment.botId));
}

/**
 * Terminate and delete a Conway sandbox permanently.
 */
export async function terminateConwayVM(deploymentId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [deployment] = await db
    .select()
    .from(conwayDeployments)
    .where(eq(conwayDeployments.id, deploymentId))
    .limit(1);

  if (!deployment) {
    throw new Error(`Conway deployment ${deploymentId} not found`);
  }

  if (deployment.sandboxId) {
    try {
      await conwayClient.deleteSandbox(deployment.sandboxId);
    } catch (err) {
      console.warn(
        `[Conway] Failed to delete sandbox ${deployment.sandboxId}:`,
        ConwayClient.formatError(err)
      );
    }
  }

  await updateDeployment(deploymentId, {
    status: "terminated",
    terminatedAt: new Date(),
    stepDescription: "Sandbox terminated and deleted.",
  });

  await db
    .update(bots)
    .set({
      status: "stopped",
      lastStoppedAt: new Date(),
      conwayDeploymentId: null,
      processId: null,
    })
    .where(eq(bots.id, deployment.botId));
}

/**
 * Fetch the current status of a deployment (used for polling from the frontend).
 */
export async function getConwayDeploymentStatus(
  deploymentId: number
): Promise<ConwayDeployment | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [deployment] = await db
    .select()
    .from(conwayDeployments)
    .where(eq(conwayDeployments.id, deploymentId))
    .limit(1);

  return deployment ?? null;
}

/**
 * List all Conway deployments, optionally filtered by botId.
 */
export async function listConwayDeployments(
  botId?: number
): Promise<ConwayDeployment[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (botId !== undefined) {
    return db
      .select()
      .from(conwayDeployments)
      .where(eq(conwayDeployments.botId, botId));
  }

  return db.select().from(conwayDeployments);
}

/**
 * Retry a failed deployment from the beginning.
 */
export async function retryConwayDeployment(
  deploymentId: number
): Promise<ProvisionResult> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [deployment] = await db
    .select()
    .from(conwayDeployments)
    .where(eq(conwayDeployments.id, deploymentId))
    .limit(1);

  if (!deployment) {
    throw new Error(`Conway deployment ${deploymentId} not found`);
  }

  if (deployment.status !== "failed") {
    throw new Error(
      `Cannot retry deployment ${deploymentId} — current status is "${deployment.status}", expected "failed"`
    );
  }

  // Increment retry count and reset
  await updateDeployment(deploymentId, {
    status: "pending",
    currentStep: 0,
    stepDescription: "Retrying provisioning...",
    lastError: null,
    retryCount: deployment.retryCount + 1,
    sandboxId: null,
    publicUrl: null,
    ipAddress: null,
  });

  // Re-run the full pipeline
  const formData = deployment.onboardingFormData
    ? JSON.parse(deployment.onboardingFormData)
    : undefined;

  return provisionConwayVM({
    botId: deployment.botId,
    buyerName: deployment.buyerName ?? undefined,
    buyerEmail: deployment.buyerEmail ?? undefined,
    formData,
    vcpu: deployment.vcpu,
    memoryMb: deployment.memoryMb,
    diskGb: deployment.diskGb,
    region: deployment.region as "us-east" | "eu-north",
  });
}
