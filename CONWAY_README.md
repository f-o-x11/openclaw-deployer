## Conway VM Auto-Provisioning

The `openclaw-deployer` now includes a powerful auto-provisioning feature that seamlessly deploys OpenClaw agents to **Conway Cloud Sandboxes**. This allows for the automated creation of sovereign, cloud-hosted AI agents, triggered directly from the dashboard or via an external webhook, such as from an AgentMart onboarding form.

This system replaces the previous local process/Docker-based deployment strategies with a robust, scalable cloud-native approach.

### Features

- **One-Click Deployment**: Deploy any configured bot to a fresh Conway VM directly from the dashboard.
- **Automated Provisioning Pipeline**: A 4-step, fully-managed pipeline handles sandbox creation, runtime initialization, configuration injection, and agent launch.
- **Real-Time Monitoring**: A new **Conway Deployments** page (`/conway`) provides a live look into the provisioning process, showing the current status, step, and resource usage for every deployment.
- **Lifecycle Management**: Stop, restart, and terminate Conway sandboxes from the UI.
- **Webhook Integration**: An endpoint is provided to trigger provisioning from external services like AgentMart.
- **Persistent State**: All deployment details, including sandbox IDs, public URLs, and status history, are stored in the database.

### How It Works

The auto-provisioning process is managed by the `ConwayDeploymentService` and orchestrated via a new `conway` tRPC router. When a deployment is triggered, it moves through the following pipeline:

1.  **Provision**: A `POST` request is sent to the Conway API (`/v1/sandboxes`) to create a new Linux VM with the specified resources (vCPU, memory, disk).
2.  **Initialize**: Once the sandbox is `running`, a series of `exec` commands are sent to:
    *   Install the Conway Terminal (`curl ... | sh`).
    *   Clone the `openclaw/openclaw` repository.
    *   Install dependencies and build the agent (`pnpm install && pnpm build`).
3.  **Configure**: The bot's configuration (name, personality, system prompt, etc.) is compiled into a `config.json` file and uploaded to `/home/ubuntu/.openclaw/config.json` in the sandbox.
4.  **Launch**: The agent is started using `pm2` for process management, and its gateway port (8080) is exposed to the internet, providing a public URL for webhook communication.

Failures at any step are caught, logged to the database, and displayed on the monitoring page for debugging.

### Using the Feature

#### 1. Dashboard Deployment

On the main dashboard, each bot card that has **not** yet been deployed to Conway will have a new **Deploy to Conway** button (cloud icon). Clicking this opens a modal where you can:

-   Optionally add buyer information (name, email).
-   Customize the VM resources (vCPU, memory, region).
-   Trigger the provisioning pipeline.

Once started, the bot card will display the live deployment status.

#### 2. Conway Deployments Page

A new top-level page, accessible via the **Conway Deployments** button in the header, provides a comprehensive dashboard for all deployments. Here you can:

-   View the status of all past and present deployments.
-   See detailed progress, including the current step and description.
-   Access the public gateway URL for running agents.
-   Perform lifecycle actions: **Stop**, **Restart**, **Retry** (for failed deployments), and **Terminate**.

#### 3. AgentMart Webhook

The system exposes a webhook endpoint designed for integration with AgentMart:

`POST /api/trpc/conway.onboardingWebhook`

This endpoint accepts a JSON payload containing the bot's configuration, buyer details, and desired VM specs. It first creates a new bot record in the database and then immediately triggers the Conway provisioning pipeline.

### Configuration

To enable the feature, you must set the following environment variables:

```env
# The base URL for the Conway Cloud API
CONWAY_API_URL="https://api.conway.tech/v1"

# Your Conway API key (obtain from the Conway dashboard)
CONWAY_API_KEY="your_conway_api_key_here"
```

### Database Schema

This feature introduces a new table, `conway_deployments`, to track the state of each provisioned VM. It is linked to the `bots` table via a new `conwayDeploymentId` foreign key.

| Field                | Purpose                                                                 |
| -------------------- | ----------------------------------------------------------------------- |
| `id`                 | Unique identifier for the deployment record.                            |
| `botId`              | Foreign key to the `bots` table.                                        |
| `sandboxId`          | The unique ID of the sandbox returned by the Conway API.                |
| `status`             | The current stage of the provisioning pipeline (e.g., `provisioning`, `running`, `failed`). |
| `currentStep`        | The current step number in the 4-step pipeline.                         |
| `stepDescription`    | A human-readable description of the current step.                       |
| `publicUrl`          | The publicly accessible URL for the agent's gateway.                    |
| `lastError`          | The error message if the pipeline fails.                                |
| `...`                | Other fields for resource specs, timestamps, and buyer metadata.        |

The `bots` table was also updated with a nullable `conwayDeploymentId` column to link a bot to its cloud deployment.
