import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getBotById } from "../db";
import { TRPCError } from "@trpc/server";
import {
  deployBot,
  startBot,
  stopBot,
  restartBot,
  deleteBot as deleteDockerBot,
  getBotLogs,
} from "../services/dockerDeployment";

export const deploymentRouter = router({
  /**
   * Deploy a bot (create Docker container)
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
        await deployBot(input.botId);
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

      try {
        await startBot(input.botId);
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
        await stopBot(input.botId);
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

      try {
        await restartBot(input.botId);
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
        const logs = await getBotLogs(input.botId);
        return { logs };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get logs: ${error.message}`,
        });
      }
    }),
});
