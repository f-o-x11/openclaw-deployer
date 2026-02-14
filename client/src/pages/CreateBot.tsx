import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function CreateBot() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [traits, setTraits] = useState("");
  const [guidelines, setGuidelines] = useState("");
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [telegramToken, setTelegramToken] = useState("");

  const createMutation = trpc.bots.create.useMutation({
    onSuccess: () => {
      toast.success("Bot created successfully!");
      setLocation("/dashboard");
    },
    onError: (error) => {
      toast.error("Failed to create bot", { description: error.message });
    },
  });

  const handleSubmit = async () => {
    const traitsArray = traits.split(",").map((t) => t.trim()).filter((t) => t.length > 0);
    await createMutation.mutateAsync({
      name,
      description,
      personalityTraits: traitsArray,
      behavioralGuidelines: guidelines,
      whatsappEnabled,
      telegramEnabled,
      telegramBotToken: telegramEnabled ? telegramToken : undefined,
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b">
        <div className="container py-6">
          <Link href="/dashboard">
            <Button variant="ghost"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
          </Link>
        </div>
      </header>

      <div className="container section max-w-3xl">
        <div className="mb-12 text-center">
          <h1 className="heading-lg mb-4">Create Your Bot</h1>
          <p className="text-body">Step {step} of 3</p>
        </div>

        {step === 1 && (
          <div className="card-dashed">
            <h2 className="text-3xl font-bold mb-8">Bot Basics</h2>
            <div className="space-y-6">
              <div>
                <Label className="text-lg font-semibold mb-2 block">Bot Name *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="My Assistant" className="input-clean text-lg" />
              </div>
              <div>
                <Label className="text-lg font-semibold mb-2 block">Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does your bot do?" className="input-clean text-lg min-h-[120px]" />
              </div>
            </div>
            <div className="mt-8 flex justify-end">
              <Button onClick={() => setStep(2)} disabled={!name.trim()} className="btn-lobster">Next <ArrowRight className="w-5 h-5 ml-2" /></Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="card-dashed">
            <h2 className="text-3xl font-bold mb-8">Personality</h2>
            <div className="space-y-6">
              <div>
                <Label className="text-lg font-semibold mb-2 block">Traits (comma-separated)</Label>
                <Input value={traits} onChange={(e) => setTraits(e.target.value)} placeholder="Helpful, Professional" className="input-clean text-lg" />
              </div>
              <div>
                <Label className="text-lg font-semibold mb-2 block">Guidelines</Label>
                <Textarea value={guidelines} onChange={(e) => setGuidelines(e.target.value)} className="input-clean text-lg min-h-[120px]" />
              </div>
            </div>
            <div className="mt-8 flex justify-between">
              <Button onClick={() => setStep(1)} variant="outline"><ArrowLeft className="w-5 h-5 mr-2" />Back</Button>
              <Button onClick={() => setStep(3)} className="btn-lobster">Next <ArrowRight className="w-5 h-5 ml-2" /></Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="card-dashed">
            <h2 className="text-3xl font-bold mb-8">Channels</h2>
            <div className="space-y-8">
              <div className="border-2 border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <input type="checkbox" checked={whatsappEnabled} onChange={(e) => setWhatsappEnabled(e.target.checked)} className="w-5 h-5" />
                  <Label className="text-xl font-bold">WhatsApp</Label>
                </div>
              </div>
              <div className="border-2 border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <input type="checkbox" checked={telegramEnabled} onChange={(e) => setTelegramEnabled(e.target.checked)} className="w-5 h-5" />
                  <Label className="text-xl font-bold">Telegram</Label>
                </div>
                {telegramEnabled && (
                  <div className="mt-4">
                    <Label className="text-base font-semibold mb-2 block">Bot Token</Label>
                    <Input value={telegramToken} onChange={(e) => setTelegramToken(e.target.value)} className="input-clean" />
                  </div>
                )}
              </div>
            </div>
            <div className="mt-8 flex justify-between">
              <Button onClick={() => setStep(2)} variant="outline"><ArrowLeft className="w-5 h-5 mr-2" />Back</Button>
              <Button onClick={handleSubmit} disabled={!(whatsappEnabled || telegramEnabled) || createMutation.isPending} className="btn-lobster">
                {createMutation.isPending ? "Creating..." : "Create Bot"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
