import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import {
  Cloud,
  RefreshCw,
  Square,
  Play,
  Trash2,
  ExternalLink,
  Zap,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Server,
  Globe,
  Cpu,
  HardDrive,
  MemoryStick,
} from "lucide-react";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

type DeploymentStatus =
  | "pending"
  | "provisioning"
  | "initializing"
  | "configuring"
  | "launching"
  | "running"
  | "stopped"
  | "failed"
  | "terminated";

const STATUS_META: Record<
  DeploymentStatus,
  { label: string; color: string; bgColor: string; icon: React.ReactNode }
> = {
  pending: {
    label: "Pending",
    color: "text-yellow-600",
    bgColor: "bg-yellow-100",
    icon: <Loader2 className="w-4 h-4 animate-spin" />,
  },
  provisioning: {
    label: "Provisioning",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    icon: <Loader2 className="w-4 h-4 animate-spin" />,
  },
  initializing: {
    label: "Initializing",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    icon: <Loader2 className="w-4 h-4 animate-spin" />,
  },
  configuring: {
    label: "Configuring",
    color: "text-indigo-600",
    bgColor: "bg-indigo-100",
    icon: <Loader2 className="w-4 h-4 animate-spin" />,
  },
  launching: {
    label: "Launching",
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    icon: <Loader2 className="w-4 h-4 animate-spin" />,
  },
  running: {
    label: "Running",
    color: "text-green-600",
    bgColor: "bg-green-100",
    icon: <CheckCircle2 className="w-4 h-4" />,
  },
  stopped: {
    label: "Stopped",
    color: "text-gray-600",
    bgColor: "bg-gray-100",
    icon: <Square className="w-4 h-4" />,
  },
  failed: {
    label: "Failed",
    color: "text-red-600",
    bgColor: "bg-red-100",
    icon: <AlertCircle className="w-4 h-4" />,
  },
  terminated: {
    label: "Terminated",
    color: "text-gray-400",
    bgColor: "bg-gray-50",
    icon: <Trash2 className="w-4 h-4" />,
  },
};

function StatusBadge({ status }: { status: DeploymentStatus }) {
  const meta = STATUS_META[status] ?? STATUS_META.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${meta.color} ${meta.bgColor}`}
    >
      {meta.icon}
      {meta.label}
    </span>
  );
}

function ProgressBar({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) {
  const pct = totalSteps > 0 ? Math.round((currentStep / totalSteps) * 100) : 0;
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-muted-foreground mb-1">
        <span>
          Step {currentStep} of {totalSteps}
        </span>
        <span>{pct}%</span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function ConwayDeployments() {
  const {
    data: deployments,
    isLoading,
    refetch,
  } = trpc.conway.list.useQuery(undefined, {
    refetchInterval: 5000, // Poll every 5 s for live updates
  });

  const stopMutation = trpc.conway.stop.useMutation({
    onSuccess: () => {
      toast.success("Sandbox stopped");
      refetch();
    },
    onError: (e) => toast.error("Stop failed", { description: e.message }),
  });

  const restartMutation = trpc.conway.restart.useMutation({
    onSuccess: () => {
      toast.success("Sandbox restarted");
      refetch();
    },
    onError: (e) => toast.error("Restart failed", { description: e.message }),
  });

  const terminateMutation = trpc.conway.terminate.useMutation({
    onSuccess: () => {
      toast.success("Sandbox terminated");
      refetch();
    },
    onError: (e) =>
      toast.error("Terminate failed", { description: e.message }),
  });

  const retryMutation = trpc.conway.retry.useMutation({
    onSuccess: () => {
      toast.success("Retrying deployment...");
      refetch();
    },
    onError: (e) => toast.error("Retry failed", { description: e.message }),
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b">
        <div className="container py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold">OpenClaw</span>
              <span className="text-xs ml-1 text-muted-foreground font-medium">
                deployer
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container py-12">
        {/* Page Title */}
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="heading-lg mb-2 flex items-center gap-3">
              <Cloud className="w-8 h-8 text-primary" />
              Conway Deployments
            </h1>
            <p className="text-body">
              Monitor and manage Conway VM auto-provisioned agents
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw
              className={`w-4 h-4 mr-1.5 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-16">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-muted-foreground">Loading deployments...</p>
          </div>
        ) : !deployments || deployments.length === 0 ? (
          <div className="card-dashed text-center py-20">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Cloud className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-3">No deployments yet</h2>
            <p className="text-body mb-8 max-w-md mx-auto">
              Deploy a bot to Conway Cloud from the dashboard to see it here.
            </p>
            <Link href="/">
              <Button className="btn-lobster">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Go to Dashboard
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {deployments.map((d: any) => {
              const status = (d.status ?? d.conway_status ?? "pending") as DeploymentStatus;
              const isActive = status === "running";
              const isFailed = status === "failed";
              const isTerminated = status === "terminated";
              const isInProgress = [
                "pending",
                "provisioning",
                "initializing",
                "configuring",
                "launching",
              ].includes(status);

              return (
                <div
                  key={d.id}
                  className="card-clean hover:shadow-md transition-shadow"
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          isActive
                            ? "bg-green-100 text-green-600"
                            : isFailed
                            ? "bg-red-100 text-red-600"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        <Server className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg leading-tight">
                          {d.sandboxName ?? `Deployment #${d.id}`}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Bot #{d.botId} &middot; {d.region}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={status} />
                  </div>

                  {/* Progress bar (only during provisioning) */}
                  {isInProgress && (
                    <div className="mb-4">
                      <ProgressBar
                        currentStep={d.currentStep}
                        totalSteps={d.totalSteps}
                      />
                      <p className="text-xs text-muted-foreground mt-1.5">
                        {d.stepDescription}
                      </p>
                    </div>
                  )}

                  {/* Error message */}
                  {isFailed && d.lastError && (
                    <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
                      <p className="text-xs text-red-700 font-mono break-all">
                        {d.lastError}
                      </p>
                    </div>
                  )}

                  {/* Specs row */}
                  <div className="flex flex-wrap gap-4 mb-4 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Cpu className="w-3.5 h-3.5" />
                      {d.vcpu} vCPU
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MemoryStick className="w-3.5 h-3.5" />
                      {d.memoryMb} MB
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <HardDrive className="w-3.5 h-3.5" />
                      {d.diskGb} GB
                    </span>
                    {d.publicUrl && (
                      <a
                        href={d.publicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        {d.publicUrl}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {d.buyerEmail && (
                      <span className="inline-flex items-center gap-1">
                        Buyer: {d.buyerName ?? d.buyerEmail}
                      </span>
                    )}
                  </div>

                  {/* Timestamps */}
                  <div className="flex flex-wrap gap-4 mb-4 text-xs text-muted-foreground">
                    <span>
                      Created:{" "}
                      {d.createdAt
                        ? new Date(d.createdAt).toLocaleString()
                        : "—"}
                    </span>
                    {d.provisionedAt && (
                      <span>
                        Provisioned:{" "}
                        {new Date(d.provisionedAt).toLocaleString()}
                      </span>
                    )}
                    {d.launchedAt && (
                      <span>
                        Launched: {new Date(d.launchedAt).toLocaleString()}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t">
                    {isActive && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          stopMutation.mutate({ deploymentId: d.id })
                        }
                        disabled={stopMutation.isPending}
                      >
                        <Square className="w-4 h-4 mr-1.5" />
                        Stop
                      </Button>
                    )}
                    {status === "stopped" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() =>
                          restartMutation.mutate({ deploymentId: d.id })
                        }
                        disabled={restartMutation.isPending}
                      >
                        <Play className="w-4 h-4 mr-1.5" />
                        Restart
                      </Button>
                    )}
                    {isFailed && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() =>
                          retryMutation.mutate({ deploymentId: d.id })
                        }
                        disabled={retryMutation.isPending}
                      >
                        <RefreshCw className="w-4 h-4 mr-1.5" />
                        Retry
                      </Button>
                    )}
                    {!isTerminated && !isInProgress && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() =>
                          terminateMutation.mutate({ deploymentId: d.id })
                        }
                        disabled={terminateMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4 mr-1.5" />
                        Terminate
                      </Button>
                    )}
                    {d.publicUrl && isActive && (
                      <a
                        href={d.publicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="outline" size="sm">
                          <ExternalLink className="w-4 h-4 mr-1.5" />
                          Open Gateway
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
