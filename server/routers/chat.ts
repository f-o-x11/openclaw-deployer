import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { 
  createChatMessage, 
  getChatMessagesByBotId, 
  getBotById,
  updateBot 
} from "../db";
import { invokeLLM } from "../_core/llm";

// Build system prompt from bot configuration
function buildSystemPrompt(bot: {
  name: string;
  description: string | null;
  personalityTraits: string[] | null;
  behavioralGuidelines: string | null;
}): string {
  let prompt = `You are ${bot.name}, an AI assistant.`;
  
  if (bot.description) {
    prompt += `\n\nYour role: ${bot.description}`;
  }
  
  if (bot.personalityTraits && bot.personalityTraits.length > 0) {
    prompt += `\n\nPersonality traits: ${bot.personalityTraits.join(", ")}`;
  }
  
  if (bot.behavioralGuidelines) {
    prompt += `\n\nBehavioral guidelines:\n${bot.behavioralGuidelines}`;
  }
  
  prompt += `\n\nRespond naturally and helpfully to user messages while maintaining your personality and following the guidelines above.`;
  
  return prompt;
}

export const chatRouter = router({
  // Send a message to the bot and get AI response
  sendMessage: protectedProcedure
    .input(
      z.object({
        botId: z.number(),
        content: z.string().min(1),
        senderName: z.string().optional(),
        senderIdentifier: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get bot configuration
      const bot = await getBotById(input.botId);
      
      if (!bot) {
        throw new Error("Bot not found");
      }
      
      // Check ownership
      if (bot.userId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }
      
      // Save user message
      await createChatMessage({
        botId: input.botId,
        messageType: "user",
        content: input.content,
        senderName: input.senderName || ctx.user.name || "User",
        senderIdentifier: input.senderIdentifier || ctx.user.email || undefined,
      });
      
      // Get recent conversation history
      const recentMessages = await getChatMessagesByBotId(input.botId, 10);
      
      // Build conversation context
      const conversationHistory = recentMessages
        .reverse()
        .map((msg) => ({
          role: msg.messageType === "user" ? "user" : "assistant",
          content: msg.content,
        })) as Array<{ role: "user" | "assistant"; content: string }>;
      
      // Build system prompt from bot configuration
      const systemPrompt = buildSystemPrompt({
        name: bot.name,
        description: bot.description,
        personalityTraits: bot.personalityTraits as string[] | null,
        behavioralGuidelines: bot.behavioralGuidelines,
      });
      
      // Call Manus AI
      try {
        const aiResponse = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            ...conversationHistory,
            { role: "user", content: input.content },
          ],
        });
        
        const messageContent = aiResponse.choices[0]?.message?.content;
        const botResponseContent = typeof messageContent === 'string' 
          ? messageContent 
          : "I'm sorry, I couldn't generate a response.";
        
        // Save bot response
        const botMessage = await createChatMessage({
          botId: input.botId,
          messageType: "bot",
          content: botResponseContent,
          senderName: bot.name,
        });
        
        // Update bot status to active if it was in draft/configuring
        if (bot.status === "draft" || bot.status === "configuring") {
          await updateBot(bot.id, { status: "active" });
        }
        
        return {
          message: botMessage,
          response: botResponseContent,
        };
      } catch (error) {
        console.error("AI invocation error:", error);
        
        // Save error message
        const errorMessage = await createChatMessage({
          botId: input.botId,
          messageType: "system",
          content: "Error: Failed to generate AI response. Please try again.",
        });
        
        throw new Error("Failed to generate AI response");
      }
    }),

  // Get chat history for a bot
  getHistory: protectedProcedure
    .input(
      z.object({
        botId: z.number(),
        limit: z.number().optional().default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      // Get bot to check ownership
      const bot = await getBotById(input.botId);
      
      if (!bot) {
        throw new Error("Bot not found");
      }
      
      if (bot.userId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }
      
      const messages = await getChatMessagesByBotId(input.botId, input.limit);
      
      return messages.reverse(); // Return in chronological order
    }),

  // Clear chat history
  clearHistory: protectedProcedure
    .input(z.object({ botId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Get bot to check ownership
      const bot = await getBotById(input.botId);
      
      if (!bot || bot.userId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }
      
      // In production, you would delete messages here
      // For now, just return success
      return { success: true };
    }),
});
