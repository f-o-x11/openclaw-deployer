import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getBotById, updateBot, getProcessLogs } from "../db";
import { TRPCError } from "@trpc/server";

export const deploymentRouter = router({
  /**
   * Activate a bot (set status to running)
   * In the Manus-hosted version, this uses the built-in LLM
   * No process spawning needed - the chat router handles LLM calls
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
        // Simply activate the bot - the chat router handles LLM calls
        await updateBot(input.botId, {
          status: "running",
          lastStartedAt: new Date(),
        });

        return { success: true, message: "Bot activated successfully" };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Activation failed: ${error.message}`,
        });
      }
    }),

  /**
   * Start a bot (alias for deploy/activate)
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

      await updateBot(input.botId, {
        status: "running",
        lastStartedAt: new Date(),
      });

      return { success: true, message: "Bot started" };
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

      await updateBot(input.botId, {
        status: "stopped",
        lastStoppedAt: new Date(),
      });

      return { success: true, message: "Bot stopped" };
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

      await updateBot(input.botId, {
        status: "running",
        lastStartedAt: new Date(),
      });

      return { success: true, message: "Bot restarted" };
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
        const logs = await getProcessLogs(input.botId);
        const logText = logs
          .map((l: any) => `[${l.timestamp?.toISOString() || ""}] [${l.logType}] ${l.content}`)
          .join("\n");
        return { logs: logText || "No logs yet. Activate the bot and start chatting!" };
      } catch (error: any) {
        return { logs: "No logs available." };
      }
    }),
});
