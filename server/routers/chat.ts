import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getBotById, addChatMessage, getChatMessages, clearChatMessages } from "../db";
import { invokeLLM } from "../_core/llm";
import { TRPCError } from "@trpc/server";

export const chatRouter = router({
  /**
   * Send a message to a bot and get an AI response
   */
  send: publicProcedure
    .input(
      z.object({
        botId: z.number(),
        message: z.string().min(1).max(10000),
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

      if (bot.status !== "running") {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Bot is not active. Please activate it first.",
        });
      }

      try {
        // Save user message
        await addChatMessage({
          botId: input.botId,
          role: "user",
          content: input.message,
        });

        // Get conversation history
        const history = await getChatMessages(input.botId, 20);

        // Build messages array for LLM
        const llmMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
          {
            role: "system",
            content: bot.systemPrompt || `You are ${bot.name}, a helpful AI assistant.`,
          },
        ];

        // Add conversation history (skip system messages from DB)
        for (const msg of history) {
          if (msg.role === "user" || msg.role === "assistant") {
            llmMessages.push({
              role: msg.role as "user" | "assistant",
              content: msg.content,
            });
          }
        }

        // Call LLM
        const response = await invokeLLM({
          messages: llmMessages,
        });

        const assistantContent =
          typeof response.choices[0]?.message?.content === "string"
            ? response.choices[0].message.content
            : "I'm sorry, I couldn't generate a response.";

        // Save assistant response
        await addChatMessage({
          botId: input.botId,
          role: "assistant",
          content: assistantContent,
        });

        return {
          content: assistantContent,
          role: "assistant" as const,
        };
      } catch (error: any) {
        console.error(`[Chat] Error for bot ${input.botId}:`, error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Chat error: ${error.message}`,
        });
      }
    }),

  /**
   * Get chat history for a bot
   */
  history: publicProcedure
    .input(z.object({ botId: z.number() }))
    .query(async ({ input }) => {
      const bot = await getBotById(input.botId);

      if (!bot) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bot not found",
        });
      }

      const messages = await getChatMessages(input.botId, 100);
      return messages;
    }),

  /**
   * Clear chat history for a bot
   */
  clear: publicProcedure
    .input(z.object({ botId: z.number() }))
    .mutation(async ({ input }) => {
      await clearChatMessages(input.botId);
      return { success: true };
    }),
});
