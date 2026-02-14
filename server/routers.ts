import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { router } from "./_core/trpc";
import { botsRouter } from "./routers/bots";
import { deploymentRouter } from "./routers/deployment";
import { whatsappRouter } from "./routers/whatsapp";
import { authRouter } from "./routers/auth";

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  bots: botsRouter,
  deployment: deploymentRouter,
  whatsapp: whatsappRouter,
});

export type AppRouter = typeof appRouter;
