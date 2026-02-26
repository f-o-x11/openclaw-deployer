/**
 * Conway Provision Modal
 *
 * A dialog that lets the operator deploy a bot to Conway Cloud directly from
 * the dashboard.  It collects optional buyer info and VM specs, then calls
 * the `conway.provision` tRPC mutation.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Cloud, Loader2, X } from "lucide-react";

interface ConwayProvisionModalProps {
  botId: number;
  botName: string;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ConwayProvisionModal({
  botId,
  botName,
  open,
  onClose,
  onSuccess,
}: ConwayProvisionModalProps) {
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [region, setRegion] = useState<"us-east" | "eu-north">("us-east");
  const [vcpu, setVcpu] = useState(1);
  const [memoryMb, setMemoryMb] = useState(1024);
  const [diskGb, setDiskGb] = useState(5);

  const provisionMutation = trpc.conway.provision.useMutation({
    onSuccess: (data) => {
      toast.success("Conway deployment started!", {
        description: `Deployment #${data.deploymentId} is now provisioning.`,
      });
      onSuccess?.();
      onClose();
    },
    onError: (error) => {
      toast.error("Provisioning failed", { description: error.message });
    },
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Cloud className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Deploy to Conway Cloud</h2>
              <p className="text-xs text-muted-foreground">
                Provision a VM for <strong>{botName}</strong>
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Buyer info */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Buyer Name{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Jane Doe"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Buyer Email{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </label>
            <input
              type="email"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="jane@example.com"
              value={buyerEmail}
              onChange={(e) => setBuyerEmail(e.target.value)}
            />
          </div>

          {/* Region */}
          <div>
            <label className="block text-sm font-medium mb-1">Region</label>
            <select
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              value={region}
              onChange={(e) =>
                setRegion(e.target.value as "us-east" | "eu-north")
              }
            >
              <option value="us-east">US East</option>
              <option value="eu-north">EU North</option>
            </select>
          </div>

          {/* VM Specs */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">vCPU</label>
              <input
                type="number"
                min={1}
                max={8}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={vcpu}
                onChange={(e) => setVcpu(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Memory (MB)
              </label>
              <input
                type="number"
                min={512}
                max={16384}
                step={512}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={memoryMb}
                onChange={(e) => setMemoryMb(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Disk (GB)
              </label>
              <input
                type="number"
                min={1}
                max={100}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={diskGb}
                onChange={(e) => setDiskGb(Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="flex-1 btn-lobster"
            disabled={provisionMutation.isPending}
            onClick={() =>
              provisionMutation.mutate({
                botId,
                buyerName: buyerName || undefined,
                buyerEmail: buyerEmail || undefined,
                region,
                vcpu,
                memoryMb,
                diskGb,
              })
            }
          >
            {provisionMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Provisioning...
              </>
            ) : (
              <>
                <Cloud className="w-4 h-4 mr-2" />
                Deploy to Conway
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
