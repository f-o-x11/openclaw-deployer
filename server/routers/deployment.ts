import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getBotById, updateBot } from "../db";
import { TRPCError } from "@trpc/server";
import {
  copyOpenClawToInstance,
  generateOpenClawConfig,
  allocatePort,
  startOpenClawProcess,
  stopOpenClawProcess,
  restartOpenClawProcess,
  cleanupBotInstance,
} from "../services/openclawDeployment";

export const deploymentRouter = router({
  /**
   * Deploy a bot (copy OpenClaw and generate config)
   */
  deploy: publicProcedure
    .input(z.object({ botId: z.number() }))
    .mutation(async ({ input }) => {
      const bot = await getBotById(input.botId);

      if (!bot) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bot not found",
        });
      }

      try {
        // Copy OpenClaw to instance directory
        const instanceDir = await copyOpenClawToInstance(input.botId);
        
        // Allocate port
        const port = allocatePort(input.botId);
        
        // Generate config
        await generateOpenClawConfig(input.botId, instanceDir, {
          name: bot.name,
          systemPrompt: bot.systemPrompt || "You are a helpful assistant",
          port,
          whatsappEnabled: bot.whatsappEnabled ?? false,
          telegramEnabled: bot.telegramEnabled ?? false,
          telegramBotToken: bot.telegramBotToken,
        });

        // Update database
        await updateBot(input.botId, {
          configPath: instanceDir,
          port,
          status: "stopped",
        });

        return { success: true, message: "Bot deployed successfully" };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Deployment failed: ${error.message}`,
        });
      }
    }),

  /**
   * Start a deployed bot
   */
  start: publicProcedure
    .input(z.object({ botId: z.number() }))
    .mutation(async ({ input }) => {
      const bot = await getBotById(input.botId);

      if (!bot) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bot not found",
        });
      }

      if (!bot.configPath || !bot.port) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Bot not deployed yet",
        });
      }

      try {
        await startOpenClawProcess(input.botId, bot.configPath, bot.port);
        return { success: true, message: "Bot started successfully" };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to start bot: ${error.message}`,
        });
      }
    }),

  /**
   * Stop a running bot
   */
  stop: publicProcedure
    .input(z.object({ botId: z.number() }))
    .mutation(async ({ input }) => {
      const bot = await getBotById(input.botId);

      if (!bot) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bot not found",
        });
      }

      try {
        await stopOpenClawProcess(input.botId);
        return { success: true, message: "Bot stopped successfully" };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to stop bot: ${error.message}`,
        });
      }
    }),

  /**
   * Restart a bot
   */
  restart: publicProcedure
    .input(z.object({ botId: z.number() }))
    .mutation(async ({ input }) => {
      const bot = await getBotById(input.botId);

      if (!bot) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bot not found",
        });
      }

      if (!bot.configPath || !bot.port) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Bot not deployed yet",
        });
      }

      try {
        await restartOpenClawProcess(input.botId, bot.configPath, bot.port);
        return { success: true, message: "Bot restarted successfully" };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to restart bot: ${error.message}`,
        });
      }
    }),

  /**
   * Get bot logs
   */
  logs: publicProcedure
    .input(z.object({ botId: z.number() }))
    .query(async ({ input }) => {
      const bot = await getBotById(input.botId);

      if (!bot) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bot not found",
        });
      }

      try {
        // For now, return a placeholder
        // The openclawDeployment service logs to console and database
        return { logs: "Check server logs for bot output" };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get logs: ${error.message}`,
        });
      }
    }),
});
