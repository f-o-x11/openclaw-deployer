import { z } from "zod";
import bcrypt from "bcryptjs";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "../_core/cookies";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { users as userTable } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { ENV } from "../_core/env";

export const authRouter = router({
  me: publicProcedure.query(opts => opts.ctx.user),
  
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return {
      success: true,
    } as const;
  }),

  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Check if user already exists
      const existingUsers = await db.select().from(userTable).where(eq(userTable.email, input.email)).limit(1);
      const existingUser = existingUsers.length > 0 ? existingUsers[0] : null;

      if (existingUser) {
        throw new Error("User with this email already exists");
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(input.password, 10);

      // Create user
      const result = await db
        .insert(userTable)
        .values({
          email: input.email,
          name: input.name,
          password: hashedPassword,
          role: "user",
        });
      
      const insertId = Number(result[0].insertId);
      const newUsers = await db.select().from(userTable).where(eq(userTable.id, insertId)).limit(1);
      const newUser = newUsers[0];

      // Generate JWT token
      const token = jwt.sign(
        { userId: newUser.id, email: newUser.email },
        ENV.cookieSecret,
        { expiresIn: "7d" }
      );

      // Set cookie
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, cookieOptions);

      return {
        success: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
        },
      };
    }),

  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Find user
      const existingUsers = await db.select().from(userTable).where(eq(userTable.email, input.email)).limit(1);
      const existingUser = existingUsers.length > 0 ? existingUsers[0] : null;

      if (!existingUser || !existingUser.password) {
        throw new Error("Invalid email or password");
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(
        input.password,
        existingUser.password
      );

      if (!isValidPassword) {
        throw new Error("Invalid email or password");
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: existingUser.id, email: existingUser.email },
        ENV.cookieSecret,
        { expiresIn: "7d" }
      );

      // Set cookie
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, cookieOptions);

      return {
        success: true,
        user: {
          id: existingUser.id,
          email: existingUser.email,
          name: existingUser.name,
          role: existingUser.role,
        },
      };
    }),
});
