import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Bot, Plus } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: bots, isLoading } = trpc.bots.list.useQuery();

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b">
        <div className="container py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bot className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold">OpenClaw Deployer</span>
          </div>
          <span className="text-muted-foreground">Welcome, {user?.name}</span>
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
                  <h3 className="text-2xl font-bold mb-2">{bot.name}</h3>
                  <p className="text-muted-foreground mb-2">{bot.description}</p>
                  <span className={`status-${bot.status}`}>{bot.status}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline">View</Button>
                  <Button variant="outline">Logs</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
