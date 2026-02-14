import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Zap, Bot, Sparkles, MessageSquare } from "lucide-react";
import { Link } from "wouter";

const PRESET_TRAITS = [
  "Helpful",
  "Professional",
  "Friendly",
  "Concise",
  "Creative",
  "Empathetic",
  "Technical",
  "Humorous",
  "Formal",
  "Casual",
];

export default function CreateBot() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);
  const [customTrait, setCustomTrait] = useState("");
  const [guidelines, setGuidelines] = useState("");
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [telegramToken, setTelegramToken] = useState("");

  const createMutation = trpc.bots.create.useMutation({
    onSuccess: (bot) => {
      toast.success("Bot created! Redirecting to chat...");
      // Activate the bot automatically
      activateMutation.mutate({ botId: bot.id });
    },
    onError: (error) => {
      toast.error("Failed to create bot", { description: error.message });
    },
  });

  const activateMutation = trpc.deployment.deploy.useMutation({
    onSuccess: (_, variables) => {
      setLocation(`/chat/${variables.botId}`);
    },
    onError: (error) => {
      toast.error("Bot created but activation failed", { description: error.message });
      setLocation("/");
    },
  });

  const toggleTrait = (trait: string) => {
    setSelectedTraits((prev) =>
      prev.includes(trait) ? prev.filter((t) => t !== trait) : [...prev, trait]
    );
  };

  const addCustomTrait = () => {
    const trimmed = customTrait.trim();
    if (trimmed && !selectedTraits.includes(trimmed)) {
      setSelectedTraits((prev) => [...prev, trimmed]);
      setCustomTrait("");
    }
  };

  const handleSubmit = async () => {
    await createMutation.mutateAsync({
      name,
      description,
      personalityTraits: selectedTraits,
      behavioralGuidelines: guidelines,
      whatsappEnabled,
      telegramEnabled,
      telegramBotToken: telegramEnabled ? telegramToken : undefined,
    });
  };

  const isCreating = createMutation.isPending || activateMutation.isPending;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b">
        <div className="container py-4 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold">OpenClaw</span>
          </div>
          <div className="w-20" /> {/* Spacer */}
        </div>
      </header>

      {/* Progress */}
      <div className="container max-w-3xl pt-8">
        <div className="flex items-center gap-2 mb-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                s <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
        <p className="text-sm text-muted-foreground mb-8">Step {step} of 3</p>
      </div>

      <div className="container max-w-3xl pb-16">
        {/* Step 1: Bot Basics */}
        {step === 1 && (
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Bot className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Bot Basics</h2>
                <p className="text-sm text-muted-foreground">Give your bot a name and purpose</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <Label className="text-sm font-semibold mb-2 block">Bot Name *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Customer Support Bot"
                  className="input-clean"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold mb-2 block">Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What does your bot do? e.g., Handles customer inquiries about our products"
                  className="input-clean min-h-[100px]"
                />
              </div>
            </div>

            <div className="mt-10 flex justify-end">
              <Button
                onClick={() => setStep(2)}
                disabled={!name.trim()}
                className="btn-lobster"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Personality */}
        {step === 2 && (
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Personality</h2>
                <p className="text-sm text-muted-foreground">
                  Define how your bot communicates
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <Label className="text-sm font-semibold mb-3 block">
                  Select personality traits
                </Label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_TRAITS.map((trait) => (
                    <button
                      key={trait}
                      onClick={() => toggleTrait(trait)}
                      className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-all ${
                        selectedTraits.includes(trait)
                          ? "border-primary bg-primary text-white"
                          : "border-border bg-white text-foreground hover:border-primary/50"
                      }`}
                    >
                      {trait}
                    </button>
                  ))}
                </div>

                {/* Custom trait */}
                <div className="flex gap-2 mt-3">
                  <Input
                    value={customTrait}
                    onChange={(e) => setCustomTrait(e.target.value)}
                    placeholder="Add custom trait..."
                    className="input-clean"
                    onKeyDown={(e) => e.key === "Enter" && addCustomTrait()}
                  />
                  <Button variant="outline" onClick={addCustomTrait} disabled={!customTrait.trim()}>
                    Add
                  </Button>
                </div>

                {/* Selected custom traits */}
                {selectedTraits.filter((t) => !PRESET_TRAITS.includes(t)).length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {selectedTraits
                      .filter((t) => !PRESET_TRAITS.includes(t))
                      .map((trait) => (
                        <span
                          key={trait}
                          className="px-3 py-1 rounded-full text-sm bg-secondary text-secondary-foreground flex items-center gap-1"
                        >
                          {trait}
                          <button
                            onClick={() => toggleTrait(trait)}
                            className="ml-1 hover:text-destructive"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                  </div>
                )}
              </div>

              <div>
                <Label className="text-sm font-semibold mb-2 block">
                  Behavioral Guidelines (optional)
                </Label>
                <Textarea
                  value={guidelines}
                  onChange={(e) => setGuidelines(e.target.value)}
                  placeholder="e.g., Always greet users warmly. Never discuss competitor products. Escalate billing issues to human agents."
                  className="input-clean min-h-[100px]"
                />
              </div>
            </div>

            <div className="mt-10 flex justify-between">
              <Button onClick={() => setStep(1)} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button onClick={() => setStep(3)} className="btn-lobster">
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Channels & Deploy */}
        {step === 3 && (
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Channels & Deploy</h2>
                <p className="text-sm text-muted-foreground">
                  Connect messaging apps (optional) and launch your bot
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* In-app chat - always enabled */}
              <div className="border-2 border-primary rounded-xl p-5 bg-primary/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">In-App Chat</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary text-white font-medium">
                        Always On
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Chat with your bot directly in the browser
                    </p>
                  </div>
                </div>
              </div>

              {/* WhatsApp */}
              <div
                className={`border-2 rounded-xl p-5 transition-colors ${
                  whatsappEnabled ? "border-green-500 bg-green-50" : "border-border"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <span className="font-bold">WhatsApp</span>
                    <p className="text-sm text-muted-foreground">
                      Connect via QR code (coming soon)
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={whatsappEnabled}
                      onChange={(e) => setWhatsappEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                  </label>
                </div>
              </div>

              {/* Telegram */}
              <div
                className={`border-2 rounded-xl p-5 transition-colors ${
                  telegramEnabled ? "border-blue-500 bg-blue-50" : "border-border"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <span className="font-bold">Telegram</span>
                    <p className="text-sm text-muted-foreground">
                      Connect with a bot token (coming soon)
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={telegramEnabled}
                      onChange={(e) => setTelegramEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                  </label>
                </div>
                {telegramEnabled && (
                  <div className="mt-4 pl-13">
                    <Label className="text-sm font-semibold mb-2 block">Bot Token</Label>
                    <Input
                      value={telegramToken}
                      onChange={(e) => setTelegramToken(e.target.value)}
                      placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                      className="input-clean"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Summary */}
            <div className="mt-8 p-5 rounded-xl bg-muted">
              <h3 className="font-bold mb-2">Summary</h3>
              <div className="text-sm space-y-1 text-muted-foreground">
                <p>
                  <span className="font-medium text-foreground">Name:</span> {name}
                </p>
                {description && (
                  <p>
                    <span className="font-medium text-foreground">Description:</span> {description}
                  </p>
                )}
                {selectedTraits.length > 0 && (
                  <p>
                    <span className="font-medium text-foreground">Traits:</span>{" "}
                    {selectedTraits.join(", ")}
                  </p>
                )}
                <p>
                  <span className="font-medium text-foreground">Channels:</span> In-App Chat
                  {whatsappEnabled ? ", WhatsApp" : ""}
                  {telegramEnabled ? ", Telegram" : ""}
                </p>
              </div>
            </div>

            <div className="mt-10 flex justify-between">
              <Button onClick={() => setStep(2)} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isCreating}
                className="btn-lobster"
              >
                {isCreating ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Creating & Activating...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Create & Chat
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
