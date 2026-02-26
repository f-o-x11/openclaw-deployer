import { useState } from "react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import {
  Bot,
  Plus,
  Power,
  PowerOff,
  Trash2,
  MessageCircle,
  Zap,
  Cloud,
} from "lucide-react";
import { toast } from "sonner";
import ConwayProvisionModal from "@/components/ConwayProvisionModal";
import ConwayDeploymentStatus from "@/components/ConwayDeploymentStatus";

export default function Dashboard() {
  const { data: bots, isLoading, refetch } = trpc.bots.list.useQuery();

  // Conway provision modal state
  const [provisionTarget, setProvisionTarget] = useState<{
    botId: number;
    botName: string;
  } | null>(null);

  const deployMutation = trpc.deployment.deploy.useMutation({
    onSuccess: () => {
      toast.success("Bot activated!");
      refetch();
    },
    onError: (error) => {
      toast.error("Activation failed", { description: error.message });
    },
  });

  const stopMutation = trpc.deployment.stop.useMutation({
    onSuccess: () => {
      toast.success("Bot deactivated");
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to stop", { description: error.message });
    },
  });

  const deleteMutation = trpc.bots.delete.useMutation({
    onSuccess: () => {
      toast.success("Bot deleted");
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to delete", { description: error.message });
    },
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
              <span className="text-xs ml-1 text-muted-foreground font-medium">deployer</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/conway">
              <Button variant="outline" size="sm">
                <Cloud className="w-4 h-4 mr-1.5" />
                Conway Deployments
              </Button>
            </Link>
            <Link href="/create">
              <Button className="btn-lobster">
                <Plus className="w-4 h-4 mr-2" />
                New Bot
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container py-12">
        {/* Page Title */}
        <div className="mb-10">
          <h1 className="heading-lg mb-2">Your Bots</h1>
          <p className="text-body">Create, activate, and chat with your AI bots</p>
        </div>

        {isLoading ? (
          <div className="text-center py-16">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-muted-foreground">Loading bots...</p>
          </div>
        ) : !bots || bots.length === 0 ? (
          <div className="card-dashed text-center py-20">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Bot className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-3">No bots yet</h2>
            <p className="text-body mb-8 max-w-md mx-auto">
              Create your first OpenClaw bot to get started. It only takes 60 seconds.
            </p>
            <Link href="/create">
              <Button className="btn-lobster">
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Bot
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {bots.map((bot: any) => {
              const isActive = bot.status === "running";
              return (
                <div
                  key={bot.id}
                  className="card-clean flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div className="mb-6">
                    {/* Bot header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            isActive
                              ? "bg-green-100 text-green-600"
                              : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          <Bot className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg leading-tight">{bot.name}</h3>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span
                              className={`inline-block w-2 h-2 rounded-full ${
                                isActive ? "bg-green-500" : "bg-gray-400"
                              }`}
                            />
                            <span className="text-xs text-muted-foreground">
                              {isActive ? "Active" : "Inactive"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive h-8 w-8"
                        onClick={() => deleteMutation.mutate({ botId: bot.id })}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {bot.description || "No description"}
                    </p>

                    {/* Traits */}
                    {bot.personalityTraits && bot.personalityTraits.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {(bot.personalityTraits as string[]).slice(0, 3).map((trait, i) => (
                          <span
                            key={i}
                            className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium"
                          >
                            {trait}
                          </span>
                        ))}
                        {(bot.personalityTraits as string[]).length > 3 && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                            +{(bot.personalityTraits as string[]).length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Conway deployment status (if deployed) */}
                    {bot.conwayDeploymentId && (
                      <ConwayDeploymentStatus
                        deploymentId={bot.conwayDeploymentId}
                      />
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link href={`/chat/${bot.id}`} className="flex-1">
                      <Button
                        variant={isActive ? "default" : "outline"}
                        className={`w-full ${isActive ? "btn-lobster" : ""}`}
                        size="sm"
                      >
                        <MessageCircle className="w-4 h-4 mr-1.5" />
                        Chat
                      </Button>
                    </Link>

                    {/* Conway deploy button */}
                    {!bot.conwayDeploymentId && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-primary hover:text-primary hover:bg-primary/5"
                        onClick={() =>
                          setProvisionTarget({
                            botId: bot.id,
                            botName: bot.name,
                          })
                        }
                      >
                        <Cloud className="w-4 h-4" />
                      </Button>
                    )}

                    {isActive ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => stopMutation.mutate({ botId: bot.id })}
                        disabled={stopMutation.isPending}
                      >
                        <PowerOff className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deployMutation.mutate({ botId: bot.id })}
                        disabled={deployMutation.isPending}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        <Power className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Conway Provision Modal */}
      {provisionTarget && (
        <ConwayProvisionModal
          botId={provisionTarget.botId}
          botName={provisionTarget.botName}
          open={true}
          onClose={() => setProvisionTarget(null)}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}
