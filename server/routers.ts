import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { router } from "./_core/trpc";
import { botsRouter } from "./routers/bots";
import { deploymentRouter } from "./routers/deployment";
import { chatRouter } from "./routers/chat";
import { authRouter } from "./routers/auth";
import { conwayRouter } from "./routers/conway";

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  bots: botsRouter,
  deployment: deploymentRouter,
  chat: chatRouter,
  conway: conwayRouter,
});

export type AppRouter = typeof appRouter;
