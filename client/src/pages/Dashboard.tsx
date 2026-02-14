import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Bot, Plus, MessageSquare, Activity, Trash2, Edit, MoreVertical } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  const { data: bots, isLoading, refetch } = trpc.bots.list.useQuery(undefined, {
    enabled: !!user,
  });

  const deleteBotMutation = trpc.bots.delete.useMutation({
    onSuccess: () => {
      toast.success("Bot deleted successfully");
      refetch();
    },
    onError: (error: { message: string }) => {
      toast.error("Failed to delete bot", {
        description: error.message,
      });
    },
  });

  const handleDeleteBot = async (botId: number, botName: string) => {
    if (confirm(`Are you sure you want to delete "${botName}"? This action cannot be undone.`)) {
      await deleteBotMutation.mutateAsync({ botId });
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-10 h-10 rounded-xl gradient-ocean flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gradient-ocean">OpenClaw Deployer</span>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Welcome, {user?.name || "User"}</span>
            <Link href="/create-bot">
              <Button className="btn-ocean">
                <Plus className="w-4 h-4 mr-2" />
                New Bot
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">My Bots</h1>
          <p className="text-muted-foreground text-lg">
            Manage your deployed OpenClaw bots
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 border-2 border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Bots</p>
                <p className="text-3xl font-bold text-primary">{bots?.length || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-xl gradient-ocean flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="p-6 border-2 border-accent/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Active Bots</p>
                <p className="text-3xl font-bold text-accent">
                  {bots?.filter((b) => b.status === "active").length || 0}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                <Activity className="w-6 h-6 text-accent" />
              </div>
            </div>
          </Card>

          <Card className="p-6 border-2 border-muted">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Messages</p>
                <p className="text-3xl font-bold">0</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-muted-foreground" />
              </div>
            </div>
          </Card>
        </div>

        {/* Bots List */}
        {!bots || bots.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="w-20 h-20 rounded-2xl gradient-ocean flex items-center justify-center mx-auto mb-4">
              <Bot className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-2">No bots yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first OpenClaw bot to get started
            </p>
            <Link href="/create-bot">
              <Button size="lg" className="btn-ocean">
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Bot
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {bots.map((bot) => (
              <Card key={bot.id} className="p-6 hover:shadow-xl transition-shadow border-2 border-primary/10 hover:border-primary/30">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl gradient-ocean flex items-center justify-center flex-shrink-0">
                      <Bot className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-1">{bot.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {bot.description}
                      </p>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setLocation(`/chat/${bot.id}`)}>
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Open Chat
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toast.info("Edit feature coming soon")}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteBot(bot.id, bot.name)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <span className={`status-${bot.status}`}>
                    {bot.status.charAt(0).toUpperCase() + bot.status.slice(1)}
                  </span>
                  {bot.personalityTraits && Array.isArray(bot.personalityTraits) && bot.personalityTraits.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      • {bot.personalityTraits.slice(0, 2).join(", ")}
                      {bot.personalityTraits.length > 2 && ` +${bot.personalityTraits.length - 2}`}
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button 
                    className="flex-1 btn-ocean" 
                    onClick={() => setLocation(`/chat/${bot.id}`)}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Open Chat
                  </Button>
                </div>

                <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
                  Created {new Date(bot.createdAt).toLocaleDateString()}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
