import { useState } from "react";
import { useLocation } from "wouter";
import { WizardLayout } from "@/components/WizardLayout";
import { Step1PersonaConfig } from "@/components/wizard/Step1PersonaConfig";
import { Step2OwnerDetails } from "@/components/wizard/Step2OwnerDetails";
import { Step3MessagingSetup } from "@/components/wizard/Step3MessagingSetup";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const WIZARD_STEPS = [
  { id: 1, title: "AI Persona", description: "Configure personality" },
  { id: 2, title: "Owner Details", description: "Your information" },
  { id: 3, title: "Messaging", description: "Connect channels" },
];

interface WizardData {
  // Step 1
  name: string;
  description: string;
  personalityTraits: string[];
  behavioralGuidelines: string;
  // Step 2
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  // Step 3
  whatsappEnabled: boolean;
  whatsappPaired: boolean;
  telegramEnabled: boolean;
  telegramBotToken: string;
  telegramConnected: boolean;
}

export default function CreateBot() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState<WizardData>({
    name: "",
    description: "",
    personalityTraits: [],
    behavioralGuidelines: "",
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
    whatsappEnabled: false,
    whatsappPaired: false,
    telegramEnabled: false,
    telegramBotToken: "",
    telegramConnected: false,
  });

  const createBotMutation = trpc.bots.create.useMutation({
    onSuccess: (bot: { name: string; id: number; status: string }) => {
      toast.success("Bot deployed successfully!", {
        description: `${bot.name} is now active and ready to chat.`,
      });
      setLocation("/dashboard");
    },
    onError: (error: { message: string }) => {
      toast.error("Failed to deploy bot", {
        description: error.message,
      });
    },
  });

  const handleStep1Update = (data: Partial<WizardData>) => {
    setWizardData((prev) => ({ ...prev, ...data }));
  };

  const handleStep2Update = (data: Partial<WizardData>) => {
    setWizardData((prev) => ({ ...prev, ...data }));
  };

  const handleStep3Update = (data: Partial<WizardData>) => {
    setWizardData((prev) => ({ ...prev, ...data }));
  };

  const handleFinish = async () => {
    try {
      await createBotMutation.mutateAsync({
        name: wizardData.name,
        description: wizardData.description,
        personalityTraits: wizardData.personalityTraits,
        behavioralGuidelines: wizardData.behavioralGuidelines,
        ownerName: wizardData.ownerName,
        ownerEmail: wizardData.ownerEmail,
        ownerPhone: wizardData.ownerPhone,
        whatsappEnabled: wizardData.whatsappEnabled,
        telegramEnabled: wizardData.telegramEnabled,
        telegramBotToken: wizardData.telegramBotToken,
      });
    } catch (error) {
      console.error("Failed to create bot:", error);
    }
  };

  return (
    <WizardLayout steps={WIZARD_STEPS} currentStep={currentStep}>
      {currentStep === 1 && (
        <Step1PersonaConfig
          data={{
            name: wizardData.name,
            description: wizardData.description,
            personalityTraits: wizardData.personalityTraits,
            behavioralGuidelines: wizardData.behavioralGuidelines,
          }}
          onUpdate={handleStep1Update}
          onNext={() => setCurrentStep(2)}
        />
      )}

      {currentStep === 2 && (
        <Step2OwnerDetails
          data={{
            ownerName: wizardData.ownerName,
            ownerEmail: wizardData.ownerEmail,
            ownerPhone: wizardData.ownerPhone,
          }}
          onUpdate={handleStep2Update}
          onNext={() => setCurrentStep(3)}
          onBack={() => setCurrentStep(1)}
        />
      )}

      {currentStep === 3 && (
        <Step3MessagingSetup
          data={{
            whatsappEnabled: wizardData.whatsappEnabled,
            whatsappPaired: wizardData.whatsappPaired,
            telegramEnabled: wizardData.telegramEnabled,
            telegramBotToken: wizardData.telegramBotToken,
            telegramConnected: wizardData.telegramConnected,
          }}
          onUpdate={handleStep3Update}
          onFinish={handleFinish}
          onBack={() => setCurrentStep(2)}
          isSubmitting={createBotMutation.isPending}
        />
      )}
    </WizardLayout>
  );
}
