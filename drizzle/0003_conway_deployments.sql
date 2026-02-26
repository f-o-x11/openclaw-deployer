-- Conway VM Auto-Provisioning: new table + bots FK column
-- Migration: 0003_conway_deployments

CREATE TABLE `conway_deployments` (
  `id` serial AUTO_INCREMENT NOT NULL,
  `botId` int NOT NULL,
  `sandboxId` varchar(255),
  `sandboxName` varchar(255),
  `region` varchar(64) NOT NULL DEFAULT 'us-east',
  `vcpu` int NOT NULL DEFAULT 1,
  `memoryMb` int NOT NULL DEFAULT 1024,
  `diskGb` int NOT NULL DEFAULT 5,
  `conway_status` enum('pending','provisioning','initializing','configuring','launching','running','stopped','failed','terminated') NOT NULL DEFAULT 'pending',
  `currentStep` int NOT NULL DEFAULT 0,
  `totalSteps` int NOT NULL DEFAULT 4,
  `stepDescription` varchar(512),
  `publicUrl` varchar(512),
  `publicPort` int,
  `ipAddress` varchar(64),
  `agentConfig` text,
  `buyerEmail` varchar(320),
  `buyerName` varchar(255),
  `onboardingFormData` text,
  `lastError` text,
  `retryCount` int NOT NULL DEFAULT 0,
  `provisionedAt` timestamp,
  `initializedAt` timestamp,
  `launchedAt` timestamp,
  `stoppedAt` timestamp,
  `terminatedAt` timestamp,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `conway_deployments_id` PRIMARY KEY(`id`)
);--> statement-breakpoint

ALTER TABLE `bots` ADD COLUMN `conwayDeploymentId` int;
