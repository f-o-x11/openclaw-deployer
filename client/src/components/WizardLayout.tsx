import { Check } from "lucide-react";
import { ReactNode } from "react";

interface WizardStep {
  id: number;
  title: string;
  description: string;
}

interface WizardLayoutProps {
  steps: WizardStep[];
  currentStep: number;
  children: ReactNode;
}

export function WizardLayout({ steps, currentStep, children }: WizardLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container py-8 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl font-bold text-gradient-ocean mb-3">
            Deploy Your OpenClaw Bot
          </h1>
          <p className="text-muted-foreground text-lg">
            Set up your AI assistant in just 3 simple steps
          </p>
        </div>

        {/* Step Indicators */}
        <div className="mb-12">
          <div className="flex items-center justify-between relative">
            {/* Progress Line */}
            <div className="absolute top-5 left-0 right-0 h-1 bg-border -z-10">
              <div
                className="h-full gradient-ocean transition-all duration-500"
                style={{
                  width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
                }}
              />
            </div>

            {/* Step Circles */}
            {steps.map((step, index) => {
              const stepNumber = index + 1;
              const isCompleted = stepNumber < currentStep;
              const isCurrent = stepNumber === currentStep;
              const isUpcoming = stepNumber > currentStep;

              return (
                <div
                  key={step.id}
                  className="flex flex-col items-center relative"
                  style={{ width: `${100 / steps.length}%` }}
                >
                  {/* Circle */}
                  <div
                    className={`
                      w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg
                      transition-all duration-300 border-4 bg-background
                      ${
                        isCompleted
                          ? "gradient-ocean text-white border-primary shadow-lg"
                          : isCurrent
                          ? "border-primary text-primary shadow-lg scale-110"
                          : "border-border text-muted-foreground"
                      }
                    `}
                  >
                    {isCompleted ? (
                      <Check className="w-6 h-6" />
                    ) : (
                      <span>{stepNumber}</span>
                    )}
                  </div>

                  {/* Label */}
                  <div className="mt-3 text-center">
                    <div
                      className={`
                        font-semibold text-sm
                        ${isCurrent ? "text-primary" : "text-muted-foreground"}
                      `}
                    >
                      {step.title}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 hidden sm:block">
                      {step.description}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="card-ocean animate-fade-in">
          {children}
        </div>
      </div>
    </div>
  );
}
