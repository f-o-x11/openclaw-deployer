import { describe, expect, it } from "vitest";
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

describe("Bot Creation and Management", () => {
  it("creates a bot with valid configuration", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.bots.create({
      name: "Test Bot",
      description: "A test bot for automated testing",
      personalityTraits: ["Helpful", "Professional"],
      behavioralGuidelines: "Always be polite and concise",
      ownerName: "Test Owner",
      ownerEmail: "owner@example.com",
      ownerPhone: "+1234567890",
      whatsappEnabled: false,
      telegramEnabled: false,
    });

    expect(result).toBeDefined();
    expect(result.name).toBe("Test Bot");
    expect(result.status).toBe("active");
  });

  it("lists bots for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a bot first
    await caller.bots.create({
      name: "List Test Bot",
      description: "Bot for list testing",
      personalityTraits: ["Friendly"],
      behavioralGuidelines: "Be helpful",
      ownerName: "Test Owner",
      ownerEmail: "owner@example.com",
      whatsappEnabled: false,
      telegramEnabled: false,
    });

    const bots = await caller.bots.list();

    expect(Array.isArray(bots)).toBe(true);
    expect(bots.length).toBeGreaterThan(0);
    expect(bots[0]).toHaveProperty("name");
    expect(bots[0]).toHaveProperty("status");
  });
});

describe("Chat Functionality", () => {
  it("sends a message and receives AI response", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a bot first
    const bot = await caller.bots.create({
      name: "Chat Test Bot",
      description: "Bot for chat testing",
      personalityTraits: ["Helpful"],
      behavioralGuidelines: "Respond concisely",
      ownerName: "Test Owner",
      ownerEmail: "owner@example.com",
      whatsappEnabled: false,
      telegramEnabled: false,
    });

    // Send a message
    const result = await caller.chat.sendMessage({
      botId: bot.id,
      content: "Hello, bot!",
      senderName: "Test User",
    });

    expect(result).toBeDefined();
    expect(result.response).toBeDefined();
    expect(typeof result.response).toBe("string");
    expect(result.response.length).toBeGreaterThan(0);
  });

  it("retrieves chat history", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a bot
    const bot = await caller.bots.create({
      name: "History Test Bot",
      description: "Bot for history testing",
      personalityTraits: ["Friendly"],
      behavioralGuidelines: "Be helpful",
      ownerName: "Test Owner",
      ownerEmail: "owner@example.com",
      whatsappEnabled: false,
      telegramEnabled: false,
    });

    // Send a message
    await caller.chat.sendMessage({
      botId: bot.id,
      content: "Test message",
      senderName: "Test User",
    });

    // Get history
    const history = await caller.chat.getHistory({
      botId: bot.id,
      limit: 10,
    });

    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBeGreaterThan(0);
    expect(history[0]).toHaveProperty("content");
    expect(history[0]).toHaveProperty("messageType");
  });
});

describe("Authorization", () => {
  it("prevents unauthorized access to other user's bots", async () => {
    const ctx1 = createAuthContext(1);
    const ctx2 = createAuthContext(2);
    const caller1 = appRouter.createCaller(ctx1);
    const caller2 = appRouter.createCaller(ctx2);

    // User 1 creates a bot
    const bot = await caller1.bots.create({
      name: "Private Bot",
      description: "User 1's bot",
      personalityTraits: ["Professional"],
      behavioralGuidelines: "Be formal",
      ownerName: "User 1",
      ownerEmail: "user1@example.com",
      whatsappEnabled: false,
      telegramEnabled: false,
    });

    // User 2 tries to access User 1's bot
    await expect(
      caller2.bots.getById({ botId: bot.id })
    ).rejects.toThrow("Unauthorized");
  });
});
