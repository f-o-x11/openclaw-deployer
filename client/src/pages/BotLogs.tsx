import { useEffect, useRef, useState } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Download, Search } from "lucide-react";
import { Link } from "wouter";

export default function BotLogs() {
  const [, params] = useRoute("/logs/:id");
  const botId = params?.id ? parseInt(params.id) : 0;

  const { data: bot } = trpc.bots.getById.useQuery({ botId });
  const { data: logsData, refetch } = trpc.deployment.logs.useQuery(
    { botId },
    {
      enabled: botId > 0,
      refetchInterval: 2000, // Refresh every 2 seconds
    }
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logsData?.logs, autoScroll]);

  const logs = logsData?.logs || "";
  const filteredLogs = searchTerm
    ? logs
        .split("\n")
        .filter((line) =>
          line.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .join("\n")
    : logs;

  const downloadLogs = () => {
    const blob = new Blob([logs], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bot-${botId}-logs.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Bot Logs</h1>
              {bot && (
                <p className="text-gray-600 mt-1">
                  {bot.name} (ID: {botId})
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoScroll(!autoScroll)}
            >
              {autoScroll ? "Disable" : "Enable"} Auto-scroll
            </Button>
            <Button variant="outline" size="sm" onClick={downloadLogs}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Logs Display */}
        <Card className="p-0 overflow-hidden">
          <div className="bg-gray-900 text-green-400 font-mono text-sm p-6 overflow-auto max-h-[600px]">
            {filteredLogs ? (
              <pre className="whitespace-pre-wrap">{filteredLogs}</pre>
            ) : (
              <div className="text-gray-500">No logs available yet...</div>
            )}
            <div ref={logsEndRef} />
          </div>
        </Card>

        {/* Status */}
        <div className="mt-4 text-sm text-gray-600 text-center">
          Auto-refreshing every 2 seconds
        </div>
      </div>
    </div>
  );
}
