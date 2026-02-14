import { useState, useEffect, useMemo } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { AIChatBox, type Message } from "@/components/AIChatBox";
import { ArrowLeft, Bot, Trash2, Power, PowerOff } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function Chat() {
  const [, params] = useRoute("/chat/:id");
  const [, setLocation] = useLocation();
  const botId = params?.id ? parseInt(params.id) : 0;

  const { data: bot, refetch: refetchBot } = trpc.bots.getById.useQuery(
    { botId },
    { enabled: botId > 0 }
  );

  const { data: chatHistory, isLoading: historyLoading } = trpc.chat.history.useQuery(
    { botId },
    { enabled: botId > 0 }
  );

  const [localMessages, setLocalMessages] = useState<Message[]>([]);

  // Sync chat history from server
  useEffect(() => {
    if (chatHistory && chatHistory.length > 0) {
      setLocalMessages(
        chatHistory
          .filter((m: any) => m.role === "user" || m.role === "assistant")
          .map((m: any) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          }))
      );
    }
  }, [chatHistory]);

  const sendMutation = trpc.chat.send.useMutation({
    onSuccess: (response) => {
      setLocalMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.content },
      ]);
    },
    onError: (error) => {
      toast.error("Failed to send message", { description: error.message });
      // Remove the optimistic user message
      setLocalMessages((prev) => prev.slice(0, -1));
    },
  });

  const clearMutation = trpc.chat.clear.useMutation({
    onSuccess: () => {
      setLocalMessages([]);
      toast.success("Chat cleared");
    },
  });

  const activateMutation = trpc.deployment.deploy.useMutation({
    onSuccess: () => {
      toast.success("Bot activated!");
      refetchBot();
    },
    onError: (error) => {
      toast.error("Failed to activate", { description: error.message });
    },
  });

  const stopMutation = trpc.deployment.stop.useMutation({
    onSuccess: () => {
      toast.success("Bot deactivated");
      refetchBot();
    },
    onError: (error) => {
      toast.error("Failed to stop", { description: error.message });
    },
  });

  const handleSendMessage = (content: string) => {
    // Add user message optimistically
    setLocalMessages((prev) => [...prev, { role: "user", content }]);
    sendMutation.mutate({ botId, message: content });
  };

  const isActive = bot?.status === "running";

  // Memoize suggested prompts
  const suggestedPrompts = useMemo(
    () => ["Hello! What can you do?", "Tell me about yourself", "How can you help me?"],
    []
  );

  if (!bot && !historyLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Bot not found</h2>
          <Link href="/">
            <Button className="btn-lobster">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold leading-tight">{bot?.name || "Loading..."}</h1>
                <div className="flex items-center gap-2">
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
          </div>

          <div className="flex items-center gap-2">
            {isActive ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => stopMutation.mutate({ botId })}
                disabled={stopMutation.isPending}
              >
                <PowerOff className="w-4 h-4 mr-1" />
                Deactivate
              </Button>
            ) : (
              <Button
                size="sm"
                className="btn-lobster"
                onClick={() => activateMutation.mutate({ botId })}
                disabled={activateMutation.isPending}
              >
                <Power className="w-4 h-4 mr-1" />
                {activateMutation.isPending ? "Activating..." : "Activate"}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => clearMutation.mutate({ botId })}
              disabled={clearMutation.isPending}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Clear
            </Button>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 container max-w-4xl py-4">
        {!isActive ? (
          <div className="flex flex-col items-center justify-center h-[calc(100vh-140px)] text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <Bot className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-3">{bot?.name || "Bot"} is inactive</h2>
            <p className="text-muted-foreground mb-8 max-w-md">
              Activate this bot to start chatting. The bot will use its configured personality and guidelines to respond.
            </p>
            <Button
              className="btn-lobster"
              onClick={() => activateMutation.mutate({ botId })}
              disabled={activateMutation.isPending}
            >
              <Power className="w-5 h-5 mr-2" />
              {activateMutation.isPending ? "Activating..." : "Activate Bot"}
            </Button>
          </div>
        ) : (
          <AIChatBox
            messages={localMessages}
            onSendMessage={handleSendMessage}
            isLoading={sendMutation.isPending}
            placeholder={`Message ${bot?.name || "bot"}...`}
            height="calc(100vh - 140px)"
            emptyStateMessage={`Start chatting with ${bot?.name || "your bot"}`}
            suggestedPrompts={suggestedPrompts}
          />
        )}
      </div>
    </div>
  );
}
