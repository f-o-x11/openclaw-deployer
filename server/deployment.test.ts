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
    expect(bot.configPath).toBeNull();
  });

  it("retrieves bot status", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const bot = await caller.bots.create({
      name: "Status Test Bot",
      description: "Bot for status testing",
      personalityTraits: ["Friendly"],
      behavioralGuidelines: "Be helpful",
      whatsappEnabled: false,
      telegramEnabled: false,
    });

    const status = await caller.deployment.getStatus({ botId: bot.id });

    expect(status).toBeDefined();
    expect(status.botId).toBe(bot.id);
    expect(status.name).toBe("Status Test Bot");
    expect(status.status).toBe("stopped");
    expect(status.isRunning).toBe(false);
  });

  it("prevents unauthorized access to bot status", async () => {
    const ctx1 = createAuthContext(1);
    const ctx2 = createAuthContext(2);
    const caller1 = appRouter.createCaller(ctx1);
    const caller2 = appRouter.createCaller(ctx2);

    const bot = await caller1.bots.create({
      name: "Private Bot",
      description: "User 1's bot",
      personalityTraits: ["Professional"],
      behavioralGuidelines: "Be formal",
      whatsappEnabled: false,
      telegramEnabled: false,
    });

    await expect(
      caller2.deployment.getStatus({ botId: bot.id })
    ).rejects.toThrow();
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
    expect(bots.every(bot => bot.userId === 1)).toBe(true);
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
