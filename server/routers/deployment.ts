import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
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
  logs: protectedProcedure
    .input(z.object({ botId: z.number() }))
    .query(async ({ ctx, input }) => {
      const bot = await getBotById(input.botId);

      if (!bot || bot.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Unauthorized",
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
