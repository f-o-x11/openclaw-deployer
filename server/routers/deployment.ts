import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getBotById, updateBot, getProcessLogs } from "../db";
import { TRPCError } from "@trpc/server";
import {
  initializeOpenClawEnvironment,
  cloneOpenClawRepo,
  installOpenClawDependencies,
  generateOpenClawConfig,
  allocatePort,
  startOpenClawProcess,
  stopOpenClawProcess,
  restartOpenClawProcess,
  isProcessRunning,
} from "../services/openclawDeployment";

// Initialize environment on server start
initializeOpenClawEnvironment().catch(console.error);

export const deploymentRouter = router({
  // Deploy a bot (clone, install, configure, start)
  deploy: protectedProcedure
    .input(z.object({ botId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const bot = await getBotById(input.botId);

      if (!bot || bot.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Unauthorized",
        });
      }

      try {
        await updateBot(input.botId, { status: "starting" });

        // Clone repository
        const instanceDir = await cloneOpenClawRepo(input.botId);

        // Install dependencies
        await installOpenClawDependencies(input.botId, instanceDir);

        // Allocate port
        const port = allocatePort(input.botId);

        // Generate configuration
        const configPath = await generateOpenClawConfig(input.botId, instanceDir, {
          name: bot.name,
          systemPrompt: bot.systemPrompt || "",
          port,
          whatsappEnabled: bot.whatsappEnabled || false,
          telegramEnabled: bot.telegramEnabled || false,
          telegramBotToken: bot.telegramBotToken,
        });

        // Update config path in database
        await updateBot(input.botId, { configPath });

        // Start process
        const pid = await startOpenClawProcess(input.botId, instanceDir, port);

        return {
          success: true,
          pid,
          port,
          message: "Bot deployed successfully",
        };
      } catch (error: any) {
        await updateBot(input.botId, { status: "crashed" });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Deployment failed: ${error.message}`,
        });
      }
    }),

  // Start a bot
  start: protectedProcedure
    .input(z.object({ botId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const bot = await getBotById(input.botId);

      if (!bot || bot.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Unauthorized",
        });
      }

      if (!bot.configPath) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Bot not deployed yet. Deploy first.",
        });
      }

      try {
        const instanceDir = `/home/ubuntu/openclaw-instances/bot-${input.botId}`;
        const port = bot.port || allocatePort(input.botId);

        await startOpenClawProcess(input.botId, instanceDir, port);

        return { success: true, message: "Bot started successfully" };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to start bot: ${error.message}`,
        });
      }
    }),

  // Stop a bot
  stop: protectedProcedure
    .input(z.object({ botId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const bot = await getBotById(input.botId);

      if (!bot || bot.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Unauthorized",
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

  // Restart a bot
  restart: protectedProcedure
    .input(z.object({ botId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const bot = await getBotById(input.botId);

      if (!bot || bot.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Unauthorized",
        });
      }

      if (!bot.configPath) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Bot not deployed yet",
        });
      }

      try {
        const instanceDir = `/home/ubuntu/openclaw-instances/bot-${input.botId}`;
        const port = bot.port || allocatePort(input.botId);

        await restartOpenClawProcess(input.botId, instanceDir, port);

        return { success: true, message: "Bot restarted successfully" };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to restart bot: ${error.message}`,
        });
      }
    }),

  // Get bot status
  getStatus: protectedProcedure
    .input(z.object({ botId: z.number() }))
    .query(async ({ ctx, input }) => {
      const bot = await getBotById(input.botId);

      if (!bot || bot.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Unauthorized",
        });
      }

      const isRunning = isProcessRunning(input.botId);

      return {
        botId: bot.id,
        name: bot.name,
        status: bot.status,
        isRunning,
        processId: bot.processId,
        port: bot.port,
        configPath: bot.configPath,
        lastStartedAt: bot.lastStartedAt,
        lastStoppedAt: bot.lastStoppedAt,
        crashCount: bot.crashCount,
      };
    }),

  // Get bot logs
  getLogs: protectedProcedure
    .input(
      z.object({
        botId: z.number(),
        limit: z.number().default(100),
      })
    )
    .query(async ({ ctx, input }) => {
      const bot = await getBotById(input.botId);

      if (!bot || bot.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Unauthorized",
        });
      }

      const logs = await getProcessLogs(input.botId, input.limit);

      return logs;
    }),
});
