/**
 * Conway Deployment Status Badge
 *
 * A compact inline component that shows the current Conway deployment status
 * for a bot.  Used inside bot cards on the Dashboard.  Polls the deployment
 * status every 5 seconds while provisioning is in progress.
 */

import { trpc } from "@/lib/trpc";
import {
  Cloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";

interface ConwayDeploymentStatusProps {
  deploymentId: number;
}

export default function ConwayDeploymentStatus({
  deploymentId,
}: ConwayDeploymentStatusProps) {
  const { data: deployment } = trpc.conway.status.useQuery(
    { deploymentId },
    {
      refetchInterval: (query) => {
        const status = query.state.data?.status;
        // Poll while in-progress
        if (
          status &&
          [
            "pending",
            "provisioning",
            "initializing",
            "configuring",
            "launching",
          ].includes(status)
        ) {
          return 3000;
        }
        return false; // Stop polling once settled
      },
    }
  );

  if (!deployment) return null;

  const status = deployment.status;
  const isInProgress = [
    "pending",
    "provisioning",
    "initializing",
    "configuring",
    "launching",
  ].includes(status);
  const isRunning = status === "running";
  const isFailed = status === "failed";

  return (
    <div className="mt-3 pt-3 border-t">
      <div className="flex items-center gap-2 text-xs">
        <Cloud className="w-3.5 h-3.5 text-primary" />
        <span className="font-medium text-muted-foreground">Conway VM</span>

        {isInProgress && (
          <span className="inline-flex items-center gap-1 text-blue-600">
            <Loader2 className="w-3 h-3 animate-spin" />
            {deployment.stepDescription ?? status}
          </span>
        )}

        {isRunning && (
          <span className="inline-flex items-center gap-1 text-green-600">
            <CheckCircle2 className="w-3 h-3" />
            Live
            {deployment.publicUrl && (
              <a
                href={deployment.publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 text-primary hover:underline ml-1"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </span>
        )}

        {isFailed && (
          <span className="inline-flex items-center gap-1 text-red-600">
            <AlertCircle className="w-3 h-3" />
            Failed
          </span>
        )}

        {status === "stopped" && (
          <span className="text-gray-500">Stopped</span>
        )}

        {status === "terminated" && (
          <span className="text-gray-400">Terminated</span>
        )}
      </div>

      {/* Progress bar for in-progress deployments */}
      {isInProgress && (
        <div className="mt-2">
          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${
                  deployment.totalSteps > 0
                    ? Math.round(
                        (deployment.currentStep / deployment.totalSteps) * 100
                      )
                    : 0
                }%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
