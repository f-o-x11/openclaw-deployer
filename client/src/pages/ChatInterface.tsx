import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Bot, Send, ArrowLeft, Loader2, User } from "lucide-react";
import { Link, useParams } from "wouter";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

export default function ChatInterface() {
  const { botId } = useParams<{ botId: string }>();
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const botIdNum = parseInt(botId || "0", 10);

  const { data: botData, isLoading: botLoading } = trpc.bots.getById.useQuery(
    { botId: botIdNum },
    { enabled: botIdNum > 0 }
  );

  const { data: messages, refetch: refetchMessages } = trpc.chat.getHistory.useQuery(
    { botId: botIdNum, limit: 100 },
    { enabled: botIdNum > 0 }
  );

  const sendMessageMutation = trpc.chat.sendMessage.useMutation({
    onSuccess: () => {
      refetchMessages();
      setMessage("");
    },
    onError: (error: { message: string }) => {
      toast.error("Failed to send message", {
        description: error.message,
      });
    },
  });

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user) return;

    await sendMessageMutation.mutateAsync({
      botId: botIdNum,
      content: message.trim(),
      senderName: user.name || "User",
      senderIdentifier: user.email || undefined,
    });
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (botLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!botData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Bot not found</h2>
          <p className="text-muted-foreground mb-4">The bot you're looking for doesn't exist.</p>
          <Link href="/dashboard">
            <Button className="btn-ocean">Back to Dashboard</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const bot = botData.bot;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex flex-col">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-ocean flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg">{bot.name}</h1>
                <p className="text-xs text-muted-foreground">
                  <span className={`status-${bot.status}`}>{bot.status}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 container py-6 flex flex-col max-w-4xl">
        <Card className="flex-1 flex flex-col overflow-hidden border-2 border-primary/20">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {!messages || messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="w-20 h-20 rounded-2xl gradient-ocean flex items-center justify-center mb-4">
                  <Bot className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">Start a conversation</h3>
                <p className="text-muted-foreground max-w-md">
                  Send a message to {bot.name} to begin chatting. Your bot is powered by Manus AI.
                </p>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${msg.messageType === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.messageType !== "user" && (
                      <div className="w-8 h-8 rounded-lg gradient-ocean flex items-center justify-center flex-shrink-0">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                    )}
                    
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                        msg.messageType === "user"
                          ? "bg-primary text-primary-foreground"
                          : msg.messageType === "system"
                          ? "bg-muted text-muted-foreground italic"
                          : "bg-card border-2 border-primary/20"
                      }`}
                    >
                      {msg.messageType === "bot" ? (
                        <Streamdown>{msg.content}</Streamdown>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      )}
                      <p className="text-xs opacity-70 mt-2">
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </p>
                    </div>

                    {msg.messageType === "user" && (
                      <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-accent-foreground" />
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t p-4 bg-muted/30">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={sendMessageMutation.isPending}
                className="flex-1 text-base"
              />
              <Button
                type="submit"
                disabled={!message.trim() || sendMessageMutation.isPending}
                className="btn-ocean"
              >
                {sendMessageMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </form>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Powered by Manus AI • Messages are processed using {bot.name}'s personality
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
