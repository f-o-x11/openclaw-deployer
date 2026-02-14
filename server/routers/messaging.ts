import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { updateMessagingChannel, getMessagingChannelsByBotId } from "../db";
import { storagePut } from "../storage";
import { nanoid } from "nanoid";

// Mock QR code generation (in production, this would use whatsapp-web.js or similar)
async function generateWhatsAppQRCode(botId: number): Promise<string> {
  // Generate a simple QR code placeholder
  // In production, this would initialize WhatsApp Web session and return actual QR
  const qrData = `whatsapp-bot-${botId}-${nanoid(10)}`;
  
  // For now, return a placeholder QR code URL
  // In production, you would generate actual QR code image and upload to S3
  const qrCodeSvg = `
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="white"/>
      <text x="100" y="100" text-anchor="middle" font-size="12" fill="black">
        QR Code: ${qrData.substring(0, 20)}...
      </text>
    </svg>
  `;
  
  const buffer = Buffer.from(qrCodeSvg);
  const fileKey = `whatsapp-qr/${botId}-${nanoid()}.svg`;
  
  const { url } = await storagePut(fileKey, buffer, "image/svg+xml");
  
  return url;
}

// Mock Telegram bot token validation
async function validateTelegramToken(token: string): Promise<{ valid: boolean; username?: string }> {
  // In production, this would call Telegram Bot API to validate token
  // https://api.telegram.org/bot<token>/getMe
  
  // Simple format validation
  const tokenRegex = /^\d+:[A-Za-z0-9_-]{35}$/;
  
  if (!tokenRegex.test(token)) {
    return { valid: false };
  }
  
  // Mock successful validation
  return {
    valid: true,
    username: `bot_${token.split(":")[0]}`,
  };
}

export const messagingRouter = router({
  // Generate WhatsApp QR code
  generateWhatsAppQR: protectedProcedure
    .input(z.object({ botId: z.number() }))
    .mutation(async ({ input }) => {
      const qrCodeUrl = await generateWhatsAppQRCode(input.botId);
      
      // Get the WhatsApp channel for this bot
      const channels = await getMessagingChannelsByBotId(input.botId);
      const whatsappChannel = channels.find((c) => c.channelType === "whatsapp");
      
      if (whatsappChannel) {
        await updateMessagingChannel(whatsappChannel.id, {
          whatsappQrCodeUrl: qrCodeUrl,
          connectionStatus: "pending",
        });
      }
      
      return { qrCodeUrl };
    }),

  // Check WhatsApp pairing status
  checkWhatsAppPairing: protectedProcedure
    .input(z.object({ botId: z.number() }))
    .query(async ({ input }) => {
      const channels = await getMessagingChannelsByBotId(input.botId);
      const whatsappChannel = channels.find((c) => c.channelType === "whatsapp");
      
      if (!whatsappChannel) {
        return { paired: false, qrCodeUrl: null };
      }
      
      // In production, check actual WhatsApp session status
      // For now, simulate pairing after 10 seconds
      const isPaired = whatsappChannel.whatsappPaired || false;
      
      return {
        paired: isPaired,
        qrCodeUrl: whatsappChannel.whatsappQrCodeUrl,
      };
    }),

  // Simulate WhatsApp pairing (for demo purposes)
  simulateWhatsAppPairing: protectedProcedure
    .input(z.object({ botId: z.number() }))
    .mutation(async ({ input }) => {
      const channels = await getMessagingChannelsByBotId(input.botId);
      const whatsappChannel = channels.find((c) => c.channelType === "whatsapp");
      
      if (whatsappChannel) {
        await updateMessagingChannel(whatsappChannel.id, {
          whatsappPaired: true,
          connectionStatus: "connected",
          lastConnectedAt: new Date(),
        });
      }
      
      return { success: true };
    }),

  // Validate Telegram bot token
  validateTelegramToken: protectedProcedure
    .input(z.object({ token: z.string(), botId: z.number() }))
    .mutation(async ({ input }) => {
      const validation = await validateTelegramToken(input.token);
      
      if (!validation.valid) {
        throw new Error("Invalid Telegram bot token format");
      }
      
      // Update the Telegram channel
      const channels = await getMessagingChannelsByBotId(input.botId);
      const telegramChannel = channels.find((c) => c.channelType === "telegram");
      
      if (telegramChannel) {
        await updateMessagingChannel(telegramChannel.id, {
          telegramBotToken: input.token,
          telegramBotUsername: validation.username,
          telegramConnected: true,
          connectionStatus: "connected",
          lastConnectedAt: new Date(),
        });
      }
      
      return {
        valid: true,
        username: validation.username,
      };
    }),

  // Get messaging channels for a bot
  getChannels: protectedProcedure
    .input(z.object({ botId: z.number() }))
    .query(async ({ input }) => {
      return await getMessagingChannelsByBotId(input.botId);
    }),
});
