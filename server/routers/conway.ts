/**
 * Conway VM Auto-Provisioning tRPC Router
 *
 * Exposes endpoints for:
 *   - Triggering a full provisioning pipeline (onboarding webhook + manual)
 *   - Querying deployment status (single + list)
 *   - Lifecycle management (stop / restart / terminate / retry)
 */

import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  provisionConwayVM,
  stopConwayVM,
  restartConwayVM,
  terminateConwayVM,
  getConwayDeploymentStatus,
  listConwayDeployments,
  retryConwayDeployment,
} from "../services/conwayDeployment";

// ---------------------------------------------------------------------------
// Input schemas
// ---------------------------------------------------------------------------

const provisionInput = z.object({
  botId: z.number(),
  buyerName: z.string().optional(),
  buyerEmail: z.string().email().optional(),
  formData: z.record(z.unknown()).optional(),
  vcpu: z.number().min(1).max(8).optional(),
  memoryMb: z.number().min(512).max(16384).optional(),
  diskGb: z.number().min(1).max(100).optional(),
  region: z.enum(["us-east", "eu-north"]).optional(),
});

const deploymentIdInput = z.object({
  deploymentId: z.number(),
});

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const conwayRouter = router({
  /**
   * Provision a new Conway VM for a bot.
   *
   * This is the primary endpoint called when:
   *   1. An AgentMart onboarding form is submitted (via webhook)
   *   2. The operator clicks "Deploy to Conway" in the dashboard
   *
   * The pipeline runs asynchronously — the mutation returns immediately with
   * the deployment ID so the frontend can poll for progress.
   */
  provision: publicProcedure.input(provisionInput).mutation(async ({ input }) => {
    try {
      const result = await provisionConwayVM(input);
      return result;
    } catch (error: any) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Conway provisioning failed: ${error.message}`,
      });
    }
  }),

  /**
   * AgentMart onboarding webhook endpoint.
   *
   * Accepts the full onboarding form payload from AgentMart and triggers
   * the provisioning pipeline.  This is a convenience wrapper around
   * `provision` that also creates the bot record if it doesn't exist.
   */
  onboardingWebhook: publicProcedure
    .input(
      z.object({
        // Bot definition from the onboarding form
        botName: z.string().min(1),
        description: z.string().optional(),
        personalityTraits: z.array(z.string()).optional(),
        behavioralGuidelines: z.string().optional(),
        systemPrompt: z.string().optional(),

        // Buyer info
        buyerName: z.string().optional(),
        buyerEmail: z.string().email().optional(),

        // Channel config
        telegramBotToken: z.string().optional(),

        // VM specs
        vcpu: z.number().min(1).max(8).optional(),
        memoryMb: z.number().min(512).max(16384).optional(),
        diskGb: z.number().min(1).max(100).optional(),
        region: z.enum(["us-east", "eu-north"]).optional(),

        // Pass-through form data
        formData: z.record(z.unknown()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Lazy import to avoid circular dependency
      const { createBot } = await import("../db");

      try {
        // Step 1: Create the bot record
        const result = await createBot({
          userId: 1, // System-created bot (no auth)
          name: input.botName,
          description: input.description ?? null,
          personalityTraits: input.personalityTraits
            ? JSON.stringify(input.personalityTraits)
            : null,
          behavioralGuidelines: input.behavioralGuidelines ?? null,
          systemPrompt:
            input.systemPrompt ??
            `You are ${input.botName}, an AI assistant powered by OpenClaw.`,
          status: "stopped",
          telegramEnabled: !!input.telegramBotToken,
          telegramBotToken: input.telegramBotToken ?? null,
        });

        const bot = result[0] as any;
        if (!bot?.id) {
          throw new Error("Failed to create bot from onboarding form");
        }

        // Step 2: Trigger Conway provisioning
        const provisionResult = await provisionConwayVM({
          botId: bot.id,
          buyerName: input.buyerName,
          buyerEmail: input.buyerEmail,
          formData: input.formData,
          vcpu: input.vcpu,
          memoryMb: input.memoryMb,
          diskGb: input.diskGb,
          region: input.region,
        });

        return {
          botId: bot.id,
          ...provisionResult,
        };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Onboarding provisioning failed: ${error.message}`,
        });
      }
    }),

  /**
   * Get the status of a single Conway deployment.
   * Used by the frontend to poll for progress during provisioning.
   */
  status: publicProcedure
    .input(deploymentIdInput)
    .query(async ({ input }) => {
      const deployment = await getConwayDeploymentStatus(input.deploymentId);
      if (!deployment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Deployment ${input.deploymentId} not found`,
        });
      }
      return deployment;
    }),

  /**
   * List all Conway deployments, optionally filtered by bot.
   */
  list: publicProcedure
    .input(z.object({ botId: z.number().optional() }).optional())
    .query(async ({ input }) => {
      return listConwayDeployments(input?.botId);
    }),

  /**
   * Stop a running Conway sandbox.
   */
  stop: publicProcedure
    .input(deploymentIdInput)
    .mutation(async ({ input }) => {
      try {
        await stopConwayVM(input.deploymentId);
        return { success: true, message: "Conway sandbox stopped" };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to stop Conway sandbox: ${error.message}`,
        });
      }
    }),

  /**
   * Restart a stopped Conway sandbox.
   */
  restart: publicProcedure
    .input(deploymentIdInput)
    .mutation(async ({ input }) => {
      try {
        await restartConwayVM(input.deploymentId);
        return { success: true, message: "Conway sandbox restarted" };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to restart Conway sandbox: ${error.message}`,
        });
      }
    }),

  /**
   * Terminate and delete a Conway sandbox permanently.
   */
  terminate: publicProcedure
    .input(deploymentIdInput)
    .mutation(async ({ input }) => {
      try {
        await terminateConwayVM(input.deploymentId);
        return { success: true, message: "Conway sandbox terminated" };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to terminate Conway sandbox: ${error.message}`,
        });
      }
    }),

  /**
   * Retry a failed deployment from scratch.
   */
  retry: publicProcedure
    .input(deploymentIdInput)
    .mutation(async ({ input }) => {
      try {
        const result = await retryConwayDeployment(input.deploymentId);
        return result;
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Retry failed: ${error.message}`,
        });
      }
    }),
});
