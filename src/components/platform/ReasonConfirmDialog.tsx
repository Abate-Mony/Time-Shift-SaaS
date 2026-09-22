import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

// Shared confirmation pattern for every sensitive platform mutation (suspend
// company, disable user, override plan, reset email domain, ...). Per the
// design brief: never a single-click confirm for a destructive action —
// always state the consequence, always require a reason, and always say the
// action is recorded in the audit log.
export function ReasonConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  destructive = false,
  busy = false,
  onConfirm,
  confirmDisabled = false,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: (reason: string) => void;
  // Extra fields to require before the reason (e.g. a plan/status picker) —
  // rendered above the reason textarea.
  confirmDisabled?: boolean;
  children?: ReactNode;
}) {
  const [reason, setReason] = useState("");

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setReason("");
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {children}

        <div className="space-y-1.5">
          <Label htmlFor="platform-reason">Reason</Label>
          <Textarea
            id="platform-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why is this action being taken?"
            rows={3}
          />
        </div>

        <p className="text-xs text-muted-foreground">This action will be recorded in the platform audit log.</p>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            disabled={busy || confirmDisabled || reason.trim().length === 0}
            onClick={() => onConfirm(reason.trim())}
          >
            {busy ? "Working…" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
