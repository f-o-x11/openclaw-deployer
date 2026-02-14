import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getBotById } from "../db";
import { TRPCError } from "@trpc/server";
import {
  initializeWhatsAppClient,
  getWhatsAppStatus,
  disconnectWhatsApp,
} from "../services/whatsappService";

export const whatsappRouter = router({
  /**
   * Initialize WhatsApp client and get QR code
   */
  initialize: publicProcedure
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
        const result = await initializeWhatsAppClient(input.botId);
        return result;
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to initialize WhatsApp: ${error.message}`,
        });
      }
    }),

  /**
   * Get WhatsApp connection status
   */
  status: publicProcedure
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
        const status = await getWhatsAppStatus(input.botId);
        return status;
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get WhatsApp status: ${error.message}`,
        });
      }
    }),

  /**
   * Disconnect WhatsApp client
   */
  disconnect: publicProcedure
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
        await disconnectWhatsApp(input.botId);
        return { success: true, message: "WhatsApp disconnected" };
      } catch (error: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to disconnect WhatsApp: ${error.message}`,
        });
      }
    }),
});
