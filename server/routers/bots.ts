import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createBot,
  getBotById,
  getBotsByUserId,
  updateBot,
  deleteBot,
  createMessagingChannel,
  getMessagingChannelsByBotId,
} from "../db";

export const botsRouter = router({
  // Create a new bot
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().min(1),
        personalityTraits: z.array(z.string()),
        behavioralGuidelines: z.string(),
        ownerName: z.string().min(1),
        ownerEmail: z.string().email(),
        ownerPhone: z.string().optional(),
        whatsappEnabled: z.boolean(),
        telegramEnabled: z.boolean(),
        telegramBotToken: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Create the bot
      const bot = await createBot({
        userId: ctx.user.id,
        name: input.name,
        description: input.description,
        personalityTraits: input.personalityTraits,
        behavioralGuidelines: input.behavioralGuidelines,
        status: "configuring",
        deploymentMetadata: {
          ownerName: input.ownerName,
          ownerEmail: input.ownerEmail,
          ownerPhone: input.ownerPhone,
        },
      });

      if (!bot) {
        throw new Error("Failed to create bot");
      }

      // Create messaging channels
      if (input.whatsappEnabled) {
        await createMessagingChannel({
          botId: bot.id,
          channelType: "whatsapp",
          connectionStatus: "pending",
        });
      }

      if (input.telegramEnabled && input.telegramBotToken) {
        await createMessagingChannel({
          botId: bot.id,
          channelType: "telegram",
          telegramBotToken: input.telegramBotToken,
          connectionStatus: "connected",
          telegramConnected: true,
        });
      }

      // Update bot status to active
      await updateBot(bot.id, { status: "active" });

      return { ...bot, status: "active" as const };
    }),

  // Get all bots for current user
  list: protectedProcedure.query(async ({ ctx }) => {
    return await getBotsByUserId(ctx.user.id);
  }),

  // Get a single bot by ID
  getById: protectedProcedure
    .input(z.object({ botId: z.number() }))
    .query(async ({ ctx, input }) => {
      const bot = await getBotById(input.botId);
      
      if (!bot) {
        throw new Error("Bot not found");
      }

      // Check ownership
      if (bot.userId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      // Get messaging channels
      const channels = await getMessagingChannelsByBotId(bot.id);

      return { bot, channels };
    }),

  // Update bot
  update: protectedProcedure
    .input(
      z.object({
        botId: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        personalityTraits: z.array(z.string()).optional(),
        behavioralGuidelines: z.string().optional(),
        status: z.enum(["draft", "configuring", "active", "paused", "error"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const bot = await getBotById(input.botId);

      if (!bot || bot.userId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      const { botId, ...updates } = input;
      await updateBot(botId, updates);

      return { success: true };
    }),

  // Delete bot
  delete: protectedProcedure
    .input(z.object({ botId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const bot = await getBotById(input.botId);

      if (!bot || bot.userId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      await deleteBot(input.botId);

      return { success: true };
    }),
});
