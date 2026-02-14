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
      whatsappEnabled: false,
      telegramEnabled: false,
    });

    expect(result).toBeDefined();
    expect(result.name).toBe("Test Bot");
    expect(result.status).toBe("stopped");
    expect(result.userId).toBe(1);
  });

  it("lists bots for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const bots = await caller.bots.list();

    expect(Array.isArray(bots)).toBe(true);
    expect(bots.every(bot => bot.userId === 1)).toBe(true);
  });

  it("retrieves a specific bot by ID", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const created = await caller.bots.create({
      name: "Specific Bot",
      description: "Bot for ID retrieval test",
      personalityTraits: ["Friendly"],
      behavioralGuidelines: "Be helpful",
      whatsappEnabled: false,
      telegramEnabled: false,
    });

    const retrieved = await caller.bots.getById({ botId: created.id });

    expect(retrieved).toBeDefined();
    expect(retrieved.id).toBe(created.id);
    expect(retrieved.name).toBe("Specific Bot");
  });

  it("returns NOT_FOUND for non-existent bot", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.bots.getById({ botId: 999999 })
    ).rejects.toThrow();
  });
});
