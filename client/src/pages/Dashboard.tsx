import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Bot, Plus, Play, Square, RotateCw, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";

export default function Dashboard() {
  const { data: bots, isLoading, refetch } = trpc.bots.list.useQuery();
  
  const deployMutation = trpc.deployment.deploy.useMutation({
    onSuccess: () => {
      toast.success("Bot deployed successfully!");
      refetch();
    },
    onError: (error) => {
      toast.error("Deployment failed", { description: error.message });
    },
  });

  const startMutation = trpc.deployment.start.useMutation({
    onSuccess: () => {
      toast.success("Bot started!");
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to start", { description: error.message });
    },
  });

  const stopMutation = trpc.deployment.stop.useMutation({
    onSuccess: () => {
      toast.success("Bot stopped!");
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to stop", { description: error.message });
    },
  });

  const restartMutation = trpc.deployment.restart.useMutation({
    onSuccess: () => {
      toast.success("Bot restarted!");
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to restart", { description: error.message });
    },
  });

  const deleteMutation = trpc.bots.delete.useMutation({
    onSuccess: () => {
      toast.success("Bot deleted!");
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to delete", { description: error.message });
    },
  });

  const handleDeploy = (botId: number) => {
    deployMutation.mutate({ botId });
  };

  const handleStart = (botId: number) => {
    startMutation.mutate({ botId });
  };

  const handleStop = (botId: number) => {
    stopMutation.mutate({ botId });
  };

  const handleRestart = (botId: number) => {
    restartMutation.mutate({ botId });
  };

  const handleDelete = (botId: number) => {
    deleteMutation.mutate({ botId });
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b">
        <div className="container py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bot className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold">OpenClaw Deployer</span>
          </div>
          <span className="text-muted-foreground">Welcome</span>
        </div>
      </header>

      <div className="container section">
        <div className="flex items-center justify-between mb-12">
          <h1 className="heading-lg">Your Bots</h1>
          <Link href="/create">
            <Button className="btn-lobster">
              <Plus className="w-5 h-5 mr-2" />
              Create Bot
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          </div>
        ) : !bots || bots.length === 0 ? (
          <div className="card-dashed text-center py-16">
            <h2 className="text-2xl font-bold mb-4">No bots yet</h2>
            <p className="text-body mb-8">Create your first OpenClaw bot to get started</p>
            <Link href="/create">
              <Button className="btn-lobster">Create Your First Bot</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bots.map((bot) => (
              <div key={bot.id} className="card-clean flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-1">{bot.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{bot.description}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className={`status-${bot.status} font-medium`}>
                      {bot.status}
                    </span>
                    {bot.port && (
                      <span className="text-muted-foreground">Port: {bot.port}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {bot.status === "stopped" && !bot.configPath && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleDeploy(bot.id)}
                      disabled={deployMutation.isPending}
                      className="bg-primary text-primary-foreground"
                    >
                      Deploy
                    </Button>
                  )}
                  {bot.status === "stopped" && bot.configPath && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStart(bot.id)}
                      disabled={startMutation.isPending}
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Start
                    </Button>
                  )}
                  {bot.status === "running" && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStop(bot.id)}
                        disabled={stopMutation.isPending}
                      >
                        <Square className="w-4 h-4 mr-1" />
                        Stop
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestart(bot.id)}
                        disabled={restartMutation.isPending}
                      >
                        <RotateCw className="w-4 h-4 mr-1" />
                        Restart
                      </Button>
                    </>
                  )}
                  <Link href={`/logs/${bot.id}`}>
                    <Button variant="outline" size="sm">
                      <FileText className="w-4 h-4 mr-1" />
                      Logs
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(bot.id)}
                    disabled={deleteMutation.isPending}
                    className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
