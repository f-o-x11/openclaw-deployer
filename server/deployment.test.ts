import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `user${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("Deployment System", () => {
  it("creates a bot successfully", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const bot = await caller.bots.create({
      name: "Test Deployment Bot",
      description: "Bot for deployment testing",
      personalityTraits: ["Helpful"],
      behavioralGuidelines: "Be professional",
      whatsappEnabled: false,
      telegramEnabled: false,
    });

    expect(bot).toBeDefined();
    expect(bot.name).toBe("Test Deployment Bot");
    expect(bot.status).toBe("stopped");
  });

  it("activates a bot via deploy", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const bot = await caller.bots.create({
      name: "Deploy Test Bot",
      description: "Bot for deploy testing",
      personalityTraits: ["Friendly"],
      behavioralGuidelines: "Be helpful",
      whatsappEnabled: false,
      telegramEnabled: false,
    });

    const result = await caller.deployment.deploy({ botId: bot.id });
    expect(result.success).toBe(true);
    expect(result.message).toContain("activated");

    // Verify the bot is now running
    const updatedBot = await caller.bots.getById({ botId: bot.id });
    expect(updatedBot.status).toBe("running");
  });

  it("stops a running bot", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const bot = await caller.bots.create({
      name: "Stop Test Bot",
      description: "Bot for stop testing",
      personalityTraits: ["Professional"],
      behavioralGuidelines: "Be formal",
      whatsappEnabled: false,
      telegramEnabled: false,
    });

    // First activate
    await caller.deployment.deploy({ botId: bot.id });

    // Then stop
    const result = await caller.deployment.stop({ botId: bot.id });
    expect(result.success).toBe(true);

    // Verify the bot is now stopped
    const updatedBot = await caller.bots.getById({ botId: bot.id });
    expect(updatedBot.status).toBe("stopped");
  });

  it("lists bots correctly", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await caller.bots.create({
      name: "List Test Bot 1",
      description: "First bot",
      personalityTraits: ["Helpful"],
      behavioralGuidelines: "Be nice",
      whatsappEnabled: false,
      telegramEnabled: false,
    });

    await caller.bots.create({
      name: "List Test Bot 2",
      description: "Second bot",
      personalityTraits: ["Professional"],
      behavioralGuidelines: "Be formal",
      whatsappEnabled: false,
      telegramEnabled: false,
    });

    const bots = await caller.bots.list();

    expect(Array.isArray(bots)).toBe(true);
    expect(bots.length).toBeGreaterThanOrEqual(2);
  });
});

describe("Bot Configuration", () => {
  it("stores bot configuration correctly", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const bot = await caller.bots.create({
      name: "Config Test Bot",
      description: "Testing configuration storage",
      personalityTraits: ["Helpful", "Professional", "Friendly"],
      behavioralGuidelines: "Always be polite and concise",
      whatsappEnabled: true,
      telegramEnabled: true,
      telegramBotToken: "test-token-123",
    });

    // personalityTraits is stored as JSON string in database
    const traits = typeof bot.personalityTraits === 'string' 
      ? JSON.parse(bot.personalityTraits) 
      : bot.personalityTraits;
    expect(traits).toEqual(["Helpful", "Professional", "Friendly"]);
    expect(bot.behavioralGuidelines).toBe("Always be polite and concise");
    expect(bot.whatsappEnabled).toBe(true);
    expect(bot.telegramEnabled).toBe(true);
    expect(bot.telegramBotToken).toBe("test-token-123");
  });

  it("generates system prompt from configuration", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const bot = await caller.bots.create({
      name: "Prompt Test Bot",
      description: "Testing system prompt generation",
      personalityTraits: ["Helpful", "Concise"],
      behavioralGuidelines: "Always provide clear answers",
      whatsappEnabled: false,
      telegramEnabled: false,
    });

    expect(bot.systemPrompt).toBeDefined();
    expect(bot.systemPrompt).toContain("Helpful");
    expect(bot.systemPrompt).toContain("Concise");
    expect(bot.systemPrompt).toContain("Always provide clear answers");
  });
});
