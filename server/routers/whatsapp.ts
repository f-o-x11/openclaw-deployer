import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
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
  initialize: protectedProcedure
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
  status: protectedProcedure
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
  disconnect: protectedProcedure
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
