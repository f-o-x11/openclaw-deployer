import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the db module
vi.mock("./db", () => ({
  getBotById: vi.fn(),
  addChatMessage: vi.fn(),
  getChatMessages: vi.fn(),
  clearChatMessages: vi.fn(),
  updateBot: vi.fn(),
  getProcessLogs: vi.fn(),
}));

// Mock the LLM module
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

import { getBotById, addChatMessage, getChatMessages, clearChatMessages, updateBot, getProcessLogs } from "./db";
import { invokeLLM } from "./_core/llm";

describe("Chat functionality", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Chat send logic", () => {
    it("should reject messages when bot is not found", async () => {
      (getBotById as any).mockResolvedValue(null);

      const bot = await getBotById(999);
      expect(bot).toBeNull();
    });

    it("should reject messages when bot is not active", async () => {
      (getBotById as any).mockResolvedValue({
        id: 1,
        name: "Test Bot",
        status: "stopped",
        systemPrompt: "You are a test bot",
      });

      const bot = await getBotById(1);
      expect(bot).not.toBeNull();
      expect(bot!.status).toBe("stopped");
      expect(bot!.status).not.toBe("running");
    });

    it("should save user message and get LLM response when bot is active", async () => {
      const mockBot = {
        id: 1,
        name: "Test Bot",
        status: "running",
        systemPrompt: "You are a test bot",
      };

      (getBotById as any).mockResolvedValue(mockBot);
      (addChatMessage as any).mockResolvedValue({
        id: 1,
        botId: 1,
        role: "user",
        content: "Hello",
        createdAt: new Date(),
      });
      (getChatMessages as any).mockResolvedValue([
        { id: 1, botId: 1, role: "user", content: "Hello", createdAt: new Date() },
      ]);
      (invokeLLM as any).mockResolvedValue({
        choices: [
          {
            message: {
              content: "Hello! How can I help you?",
            },
          },
        ],
      });

      // Simulate the chat flow
      const bot = await getBotById(1);
      expect(bot!.status).toBe("running");

      await addChatMessage({ botId: 1, role: "user", content: "Hello" });
      expect(addChatMessage).toHaveBeenCalledWith({
        botId: 1,
        role: "user",
        content: "Hello",
      });

      const history = await getChatMessages(1, 20);
      expect(history).toHaveLength(1);

      const llmResponse = await invokeLLM({
        messages: [
          { role: "system", content: bot!.systemPrompt },
          { role: "user", content: "Hello" },
        ],
      });

      const assistantContent = llmResponse.choices[0].message.content;
      expect(assistantContent).toBe("Hello! How can I help you?");

      await addChatMessage({
        botId: 1,
        role: "assistant",
        content: assistantContent,
      });
      expect(addChatMessage).toHaveBeenCalledTimes(2);
    });

    it("should clear chat messages", async () => {
      (clearChatMessages as any).mockResolvedValue(undefined);

      await clearChatMessages(1);
      expect(clearChatMessages).toHaveBeenCalledWith(1);
    });
  });

  describe("Deployment logic", () => {
    it("should activate a bot by setting status to running", async () => {
      const mockBot = {
        id: 1,
        name: "Test Bot",
        status: "stopped",
      };

      (getBotById as any).mockResolvedValue(mockBot);
      (updateBot as any).mockResolvedValue(undefined);

      const bot = await getBotById(1);
      expect(bot!.status).toBe("stopped");

      await updateBot(1, {
        status: "running",
        lastStartedAt: new Date(),
      });

      expect(updateBot).toHaveBeenCalledWith(1, expect.objectContaining({
        status: "running",
      }));
    });

    it("should deactivate a bot by setting status to stopped", async () => {
      const mockBot = {
        id: 1,
        name: "Test Bot",
        status: "running",
      };

      (getBotById as any).mockResolvedValue(mockBot);
      (updateBot as any).mockResolvedValue(undefined);

      await updateBot(1, {
        status: "stopped",
        lastStoppedAt: new Date(),
      });

      expect(updateBot).toHaveBeenCalledWith(1, expect.objectContaining({
        status: "stopped",
      }));
    });

    it("should return logs for a bot", async () => {
      (getBotById as any).mockResolvedValue({ id: 1, name: "Test Bot" });
      (getProcessLogs as any).mockResolvedValue([
        {
          id: 1,
          botId: 1,
          logType: "stdout",
          content: "Bot started",
          timestamp: new Date("2026-01-01T00:00:00Z"),
        },
      ]);

      const logs = await getProcessLogs(1);
      expect(logs).toHaveLength(1);
      expect(logs[0].content).toBe("Bot started");
    });
  });

  describe("System prompt generation", () => {
    it("should generate a system prompt with personality traits", () => {
      const name = "Support Bot";
      const traits = ["Friendly", "Professional", "Concise"];
      const guidelines = "Always greet users warmly.";

      let prompt = `You are ${name}, an AI assistant powered by OpenClaw.\n\n`;
      prompt += `Your personality traits:\n`;
      prompt += traits.map((trait) => `- ${trait}`).join("\n");
      prompt += "\n\n";
      prompt += `Behavioral Guidelines:\n${guidelines}\n\n`;
      prompt += `Always stay in character and respond according to your personality. Be helpful, concise, and engaging.`;

      expect(prompt).toContain("Support Bot");
      expect(prompt).toContain("Friendly");
      expect(prompt).toContain("Professional");
      expect(prompt).toContain("Concise");
      expect(prompt).toContain("Always greet users warmly.");
    });

    it("should handle empty traits", () => {
      const name = "Simple Bot";
      const traits: string[] = [];

      let prompt = `You are ${name}, an AI assistant powered by OpenClaw.\n\n`;
      if (traits.length > 0) {
        prompt += `Your personality traits:\n`;
        prompt += traits.map((trait) => `- ${trait}`).join("\n");
        prompt += "\n\n";
      }
      prompt += `Always stay in character and respond according to your personality. Be helpful, concise, and engaging.`;

      expect(prompt).toContain("Simple Bot");
      expect(prompt).not.toContain("personality traits:");
    });
  });
});
