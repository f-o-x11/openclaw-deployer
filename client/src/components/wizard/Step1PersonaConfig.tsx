import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, Sparkles } from "lucide-react";
import { useState } from "react";

interface PersonaData {
  name: string;
  description: string;
  personalityTraits: string[];
  behavioralGuidelines: string;
}

interface Step1PersonaConfigProps {
  data: PersonaData;
  onUpdate: (data: PersonaData) => void;
  onNext: () => void;
}

const SUGGESTED_TRAITS = [
  "Helpful",
  "Professional",
  "Friendly",
  "Concise",
  "Detailed",
  "Empathetic",
  "Humorous",
  "Formal",
  "Creative",
  "Analytical",
];

export function Step1PersonaConfig({ data, onUpdate, onNext }: Step1PersonaConfigProps) {
  const [traitInput, setTraitInput] = useState("");

  const handleAddTrait = (trait: string) => {
    if (trait && !data.personalityTraits.includes(trait)) {
      onUpdate({
        ...data,
        personalityTraits: [...data.personalityTraits, trait],
      });
      setTraitInput("");
    }
  };

  const handleRemoveTrait = (trait: string) => {
    onUpdate({
      ...data,
      personalityTraits: data.personalityTraits.filter((t) => t !== trait),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (data.name && data.description) {
      onNext();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl gradient-ocean flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">AI Persona Configuration</h2>
          <p className="text-muted-foreground">Define your bot's personality and behavior</p>
        </div>
      </div>

      {/* Bot Name */}
      <div className="space-y-2">
        <Label htmlFor="botName" className="text-base font-semibold">
          Bot Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="botName"
          placeholder="e.g., Customer Support Bot, Sales Assistant"
          value={data.name}
          onChange={(e) => onUpdate({ ...data, name: e.target.value })}
          required
          className="text-base"
        />
        <p className="text-sm text-muted-foreground">
          Choose a memorable name for your AI assistant
        </p>
      </div>

      {/* Bot Description */}
      <div className="space-y-2">
        <Label htmlFor="botDescription" className="text-base font-semibold">
          Description <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="botDescription"
          placeholder="Describe what your bot does and its primary purpose..."
          value={data.description}
          onChange={(e) => onUpdate({ ...data, description: e.target.value })}
          required
          rows={4}
          className="text-base resize-none"
        />
        <p className="text-sm text-muted-foreground">
          Explain your bot's role and main responsibilities
        </p>
      </div>

      {/* Personality Traits */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Personality Traits</Label>
        
        {/* Selected Traits */}
        {data.personalityTraits.length > 0 && (
          <div className="flex flex-wrap gap-2 p-4 bg-muted/50 rounded-lg border-2 border-dashed-ocean">
            {data.personalityTraits.map((trait) => (
              <Badge
                key={trait}
                variant="secondary"
                className="px-3 py-1.5 text-sm bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20"
              >
                {trait}
                <button
                  type="button"
                  onClick={() => handleRemoveTrait(trait)}
                  className="ml-2 hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Suggested Traits */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Select from suggestions:</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_TRAITS.filter((t) => !data.personalityTraits.includes(t)).map((trait) => (
              <Button
                key={trait}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAddTrait(trait)}
                className="rounded-full"
              >
                + {trait}
              </Button>
            ))}
          </div>
        </div>

        {/* Custom Trait Input */}
        <div className="flex gap-2">
          <Input
            placeholder="Add custom trait..."
            value={traitInput}
            onChange={(e) => setTraitInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddTrait(traitInput);
              }
            }}
          />
          <Button
            type="button"
            onClick={() => handleAddTrait(traitInput)}
            variant="outline"
          >
            Add
          </Button>
        </div>
      </div>

      {/* Behavioral Guidelines */}
      <div className="space-y-2">
        <Label htmlFor="guidelines" className="text-base font-semibold">
          Behavioral Guidelines
        </Label>
        <Textarea
          id="guidelines"
          placeholder="Define how your bot should behave, respond, and interact with users..."
          value={data.behavioralGuidelines}
          onChange={(e) => onUpdate({ ...data, behavioralGuidelines: e.target.value })}
          rows={5}
          className="text-base resize-none"
        />
        <p className="text-sm text-muted-foreground">
          Provide specific instructions on tone, response style, and conversation rules
        </p>
      </div>

      {/* Navigation */}
      <div className="flex justify-end pt-4 border-t">
        <Button
          type="submit"
          size="lg"
          className="btn-ocean"
          disabled={!data.name || !data.description}
        >
          Continue to Owner Details →
        </Button>
      </div>
    </form>
  );
}
