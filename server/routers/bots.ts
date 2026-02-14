import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { createBot, getBotsByUserId, getBotById, updateBot, deleteBot } from "../db";
import { TRPCError } from "@trpc/server";

export const botsRouter = router({
  // Create a new OpenClaw bot instance
  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        personalityTraits: z.array(z.string()).optional(),
        behavioralGuidelines: z.string().optional(),
        whatsappEnabled: z.boolean().default(false),
        telegramEnabled: z.boolean().default(false),
        telegramBotToken: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Generate system prompt from personality
      const systemPrompt = generateSystemPrompt(
        input.name,
        input.personalityTraits || [],
        input.behavioralGuidelines
      );

      const result = await createBot({
        userId: 1, // Temporary: no auth
        name: input.name,
        description: input.description || null,
        personalityTraits: JSON.stringify(input.personalityTraits || []),
        behavioralGuidelines: input.behavioralGuidelines || null,
        systemPrompt,
        status: "stopped",
        whatsappEnabled: input.whatsappEnabled,
        telegramEnabled: input.telegramEnabled,
        telegramBotToken: input.telegramBotToken || null,
      });

      // PostgreSQL returns rows array
      const insertIdRaw = (result as any)[0]?.id || (result as any).id;
      const botId = typeof insertIdRaw === 'bigint' ? Number(insertIdRaw) : Number(insertIdRaw);
      const bot = await getBotById(botId);
      
      if (!bot) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create bot",
        });
      }

      return bot;
    }),

  // List all bots
  list: publicProcedure.query(async () => {
    const bots = await getBotsByUserId(1); // Temporary: no auth
    return bots.map((bot) => ({
      ...bot,
      personalityTraits: bot.personalityTraits ? JSON.parse(bot.personalityTraits) : [],
    }));
  }),

  // Get single bot by ID
  getById: publicProcedure
    .input(z.object({ botId: z.number() }))
    .query(async ({ input }) => {
      const bot = await getBotById(input.botId);

      if (!bot) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bot not found",
        });
      }

      return {
        ...bot,
        personalityTraits: bot.personalityTraits ? JSON.parse(bot.personalityTraits) : [],
      };
    }),

  // Update bot configuration
  update: publicProcedure
    .input(
      z.object({
        botId: z.number(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        personalityTraits: z.array(z.string()).optional(),
        behavioralGuidelines: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const bot = await getBotById(input.botId);

      if (!bot) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bot not found",
        });
      }

      const updates: Record<string, unknown> = {};
      if (input.name) updates.name = input.name;
      if (input.description !== undefined) updates.description = input.description;
      if (input.personalityTraits) {
        updates.personalityTraits = JSON.stringify(input.personalityTraits);
      }
      if (input.behavioralGuidelines !== undefined) {
        updates.behavioralGuidelines = input.behavioralGuidelines;
      }

      // Regenerate system prompt if personality changed
      if (input.personalityTraits || input.behavioralGuidelines) {
        updates.systemPrompt = generateSystemPrompt(
          input.name || bot.name,
          input.personalityTraits || (bot.personalityTraits ? JSON.parse(bot.personalityTraits) : []),
          input.behavioralGuidelines || bot.behavioralGuidelines || undefined
        );
      }

      await updateBot(input.botId, updates);

      return { success: true };
    }),

  // Delete bot
  delete: publicProcedure
    .input(z.object({ botId: z.number() }))
    .mutation(async ({ input }) => {
      const bot = await getBotById(input.botId);

      if (!bot) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bot not found",
        });
      }

      // TODO: Stop process if running before deleting

      await deleteBot(input.botId);

      return { success: true };
    }),
});

// Helper function to generate system prompt from personality
function generateSystemPrompt(
  name: string,
  traits: string[],
  guidelines?: string
): string {
  let prompt = `You are ${name}, an AI assistant with the following personality traits:\n`;

  if (traits.length > 0) {
    prompt += traits.map((trait) => `- ${trait}`).join("\n");
    prompt += "\n\n";
  }

  if (guidelines) {
    prompt += `Behavioral Guidelines:\n${guidelines}\n\n`;
  }

  prompt += `Always stay in character and respond according to your personality.`;

  return prompt;
}
