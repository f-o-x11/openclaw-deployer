CREATE TABLE `bot_analytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`botId` int NOT NULL,
	`totalMessages` int NOT NULL DEFAULT 0,
	`totalConversations` int NOT NULL DEFAULT 0,
	`averageResponseTime` int DEFAULT 0,
	`uptime` int DEFAULT 0,
	`lastMessageAt` timestamp,
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bot_analytics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`personalityTraits` json,
	`behavioralGuidelines` text,
	`status` enum('draft','configuring','active','paused','error') NOT NULL DEFAULT 'draft',
	`configFileUrl` text,
	`deploymentMetadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chat_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`botId` int NOT NULL,
	`channelId` int,
	`messageType` enum('user','bot','system') NOT NULL,
	`content` text NOT NULL,
	`senderName` varchar(255),
	`senderIdentifier` varchar(255),
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chat_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messaging_channels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`botId` int NOT NULL,
	`channelType` enum('whatsapp','telegram','slack') NOT NULL,
	`whatsappQrCodeUrl` text,
	`whatsappSessionData` text,
	`whatsappPaired` boolean DEFAULT false,
	`telegramBotToken` text,
	`telegramBotUsername` varchar(255),
	`telegramConnected` boolean DEFAULT false,
	`webhookUrl` text,
	`connectionStatus` enum('pending','connected','disconnected','error') NOT NULL DEFAULT 'pending',
	`lastConnectedAt` timestamp,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `messaging_channels_id` PRIMARY KEY(`id`)
);
