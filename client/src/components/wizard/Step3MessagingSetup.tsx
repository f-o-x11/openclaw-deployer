import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { MessageSquare, CheckCircle2, Loader2, QrCode } from "lucide-react";
import { useState } from "react";

interface MessagingData {
  whatsappEnabled: boolean;
  whatsappPaired: boolean;
  telegramEnabled: boolean;
  telegramBotToken: string;
  telegramConnected: boolean;
}

interface Step3MessagingSetupProps {
  data: MessagingData;
  onUpdate: (data: MessagingData) => void;
  onFinish: () => void;
  onBack: () => void;
  isSubmitting?: boolean;
}

export function Step3MessagingSetup({ 
  data, 
  onUpdate, 
  onFinish, 
  onBack,
  isSubmitting = false 
}: Step3MessagingSetupProps) {
  const [activeTab, setActiveTab] = useState<string>("whatsapp");
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);

  const handleGenerateWhatsAppQR = async () => {
    setIsGeneratingQR(true);
    // TODO: Call backend to generate WhatsApp QR code
    setTimeout(() => {
      setIsGeneratingQR(false);
      onUpdate({ ...data, whatsappEnabled: true });
    }, 2000);
  };

  const handleTestTelegramToken = async () => {
    if (!data.telegramBotToken) return;
    
    setIsTestingTelegram(true);
    // TODO: Call backend to validate Telegram bot token
    setTimeout(() => {
      setIsTestingTelegram(false);
      onUpdate({ ...data, telegramEnabled: true, telegramConnected: true });
    }, 1500);
  };

  const canFinish = data.whatsappEnabled || data.telegramEnabled;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl gradient-ocean flex items-center justify-center">
          <MessageSquare className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Messaging Integration</h2>
          <p className="text-muted-foreground">Connect your bot to WhatsApp or Telegram</p>
        </div>
      </div>

      {/* Channel Selection Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="whatsapp" className="text-base">
            WhatsApp
          </TabsTrigger>
          <TabsTrigger value="telegram" className="text-base">
            Telegram
          </TabsTrigger>
        </TabsList>

        {/* WhatsApp Setup */}
        <TabsContent value="whatsapp" className="space-y-4 mt-6">
          <Card className="p-6 border-2 border-primary/20">
            <h3 className="font-semibold text-lg mb-3">WhatsApp Device Pairing</h3>
            <p className="text-muted-foreground mb-4">
              Scan the QR code with your WhatsApp mobile app to connect your bot
            </p>

            {!data.whatsappEnabled ? (
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-8 flex flex-col items-center justify-center min-h-[300px] border-2 border-dashed-ocean">
                  <QrCode className="w-16 h-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center mb-4">
                    Click the button below to generate your WhatsApp QR code
                  </p>
                  <Button
                    onClick={handleGenerateWhatsAppQR}
                    disabled={isGeneratingQR}
                    className="btn-ocean"
                  >
                    {isGeneratingQR ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating QR Code...
                      </>
                    ) : (
                      "Generate QR Code"
                    )}
                  </Button>
                </div>

                <div className="bg-accent/10 border border-accent/30 rounded-lg p-4">
                  <h4 className="font-semibold text-sm mb-2">How to scan:</h4>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Open WhatsApp on your phone</li>
                    <li>Tap Menu (⋮) → Linked Devices</li>
                    <li>Tap "Link a Device"</li>
                    <li>Point your phone at the QR code</li>
                  </ol>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* QR Code Display (Placeholder) */}
                <div className="bg-white rounded-lg p-8 flex flex-col items-center justify-center min-h-[300px] border-2 border-primary">
                  <div className="w-64 h-64 bg-muted rounded-lg flex items-center justify-center mb-4">
                    {data.whatsappPaired ? (
                      <CheckCircle2 className="w-24 h-24 text-green-500" />
                    ) : (
                      <div className="text-center">
                        <QrCode className="w-24 h-24 text-primary mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">QR Code would appear here</p>
                      </div>
                    )}
                  </div>
                  
                  {data.whatsappPaired ? (
                    <div className="text-center">
                      <p className="text-green-600 font-semibold text-lg">✓ Device Paired Successfully!</p>
                      <p className="text-muted-foreground text-sm mt-1">Your bot is ready to receive WhatsApp messages</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Waiting for device pairing...</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Telegram Setup */}
        <TabsContent value="telegram" className="space-y-4 mt-6">
          <Card className="p-6 border-2 border-primary/20">
            <h3 className="font-semibold text-lg mb-3">Telegram Bot Token</h3>
            <p className="text-muted-foreground mb-4">
              Enter your Telegram bot token to connect your bot
            </p>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="telegramToken" className="text-base font-semibold">
                  Bot Token
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="telegramToken"
                    type="password"
                    placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                    value={data.telegramBotToken}
                    onChange={(e) => onUpdate({ ...data, telegramBotToken: e.target.value })}
                    className="text-base font-mono"
                  />
                  <Button
                    onClick={handleTestTelegramToken}
                    disabled={!data.telegramBotToken || isTestingTelegram}
                    variant="outline"
                  >
                    {isTestingTelegram ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Test"
                    )}
                  </Button>
                </div>
                {data.telegramConnected && (
                  <p className="text-green-600 text-sm flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Token validated successfully!
                  </p>
                )}
              </div>

              <div className="bg-accent/10 border border-accent/30 rounded-lg p-4">
                <h4 className="font-semibold text-sm mb-2">How to get your bot token:</h4>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Open Telegram and search for @BotFather</li>
                  <li>Send the command /newbot</li>
                  <li>Follow the instructions to create your bot</li>
                  <li>Copy the bot token provided by BotFather</li>
                  <li>Paste it in the field above</li>
                </ol>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Status Summary */}
      <Card className="p-4 bg-muted/50">
        <h4 className="font-semibold mb-2">Integration Status</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">WhatsApp</span>
            <span className={`text-sm font-medium ${data.whatsappPaired ? "text-green-600" : "text-muted-foreground"}`}>
              {data.whatsappPaired ? "✓ Connected" : "Not connected"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Telegram</span>
            <span className={`text-sm font-medium ${data.telegramConnected ? "text-green-600" : "text-muted-foreground"}`}>
              {data.telegramConnected ? "✓ Connected" : "Not connected"}
            </span>
          </div>
        </div>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={onBack}
          disabled={isSubmitting}
        >
          ← Back
        </Button>
        <Button
          onClick={onFinish}
          size="lg"
          className="btn-ocean"
          disabled={!canFinish || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Deploying Bot...
            </>
          ) : (
            "Deploy Bot 🚀"
          )}
        </Button>
      </div>
    </div>
  );
}
