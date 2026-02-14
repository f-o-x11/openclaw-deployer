import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User } from "lucide-react";

interface OwnerData {
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
}

interface Step2OwnerDetailsProps {
  data: OwnerData;
  onUpdate: (data: OwnerData) => void;
  onNext: () => void;
  onBack: () => void;
}

export function Step2OwnerDetails({ data, onUpdate, onNext, onBack }: Step2OwnerDetailsProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (data.ownerName && data.ownerEmail) {
      onNext();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl gradient-ocean flex items-center justify-center">
          <User className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Owner Details</h2>
          <p className="text-muted-foreground">Tell us who will manage this bot</p>
        </div>
      </div>

      {/* Owner Name */}
      <div className="space-y-2">
        <Label htmlFor="ownerName" className="text-base font-semibold">
          Your Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="ownerName"
          placeholder="John Doe"
          value={data.ownerName}
          onChange={(e) => onUpdate({ ...data, ownerName: e.target.value })}
          required
          className="text-base"
        />
        <p className="text-sm text-muted-foreground">
          The person responsible for managing this bot
        </p>
      </div>

      {/* Owner Email */}
      <div className="space-y-2">
        <Label htmlFor="ownerEmail" className="text-base font-semibold">
          Email Address <span className="text-destructive">*</span>
        </Label>
        <Input
          id="ownerEmail"
          type="email"
          placeholder="john@example.com"
          value={data.ownerEmail}
          onChange={(e) => onUpdate({ ...data, ownerEmail: e.target.value })}
          required
          className="text-base"
        />
        <p className="text-sm text-muted-foreground">
          We'll send important notifications and updates here
        </p>
      </div>

      {/* Owner Phone */}
      <div className="space-y-2">
        <Label htmlFor="ownerPhone" className="text-base font-semibold">
          Phone Number (Optional)
        </Label>
        <Input
          id="ownerPhone"
          type="tel"
          placeholder="+1 (555) 123-4567"
          value={data.ownerPhone}
          onChange={(e) => onUpdate({ ...data, ownerPhone: e.target.value })}
          className="text-base"
        />
        <p className="text-sm text-muted-foreground">
          For urgent notifications and WhatsApp integration
        </p>
      </div>

      {/* Info Box */}
      <div className="bg-accent/10 border-2 border-accent/30 rounded-xl p-4">
        <h3 className="font-semibold text-accent-foreground mb-2">Why we need this information</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Send deployment status updates</li>
          <li>• Notify you of important bot events</li>
          <li>• Provide support when needed</li>
          <li>• Enable WhatsApp integration (if phone provided)</li>
        </ul>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={onBack}
        >
          ← Back
        </Button>
        <Button
          type="submit"
          size="lg"
          className="btn-ocean"
          disabled={!data.ownerName || !data.ownerEmail}
        >
          Continue to Messaging Setup →
        </Button>
      </div>
    </form>
  );
}
