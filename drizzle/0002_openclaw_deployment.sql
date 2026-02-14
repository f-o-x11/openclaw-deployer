CREATE TABLE `bots` (
`id` int AUTO_INCREMENT NOT NULL,
`userId` int NOT NULL,
`name` varchar(255) NOT NULL,
`description` text,
`personalityTraits` text,
`behavioralGuidelines` text,
`systemPrompt` text,
`processId` int,
`port` int,
`status` enum('stopped','starting','running','crashed','stopping') NOT NULL DEFAULT 'stopped',
`configPath` varchar(512),
`whatsappEnabled` boolean DEFAULT false,
`whatsappQrCode` text,
`whatsappPaired` boolean DEFAULT false,
`telegramEnabled` boolean DEFAULT false,
`telegramBotToken` varchar(255),
`telegramBotUsername` varchar(255),
`lastStartedAt` timestamp,
`lastStoppedAt` timestamp,
`crashCount` int DEFAULT 0,
`createdAt` timestamp NOT NULL DEFAULT (now()),
`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
CONSTRAINT `bots_id` PRIMARY KEY(`id`)
);

CREATE TABLE `process_logs` (
`id` int AUTO_INCREMENT NOT NULL,
`botId` int NOT NULL,
`logType` enum('stdout','stderr','system') NOT NULL,
`content` text NOT NULL,
`timestamp` timestamp NOT NULL DEFAULT (now()),
CONSTRAINT `process_logs_id` PRIMARY KEY(`id`)
);
