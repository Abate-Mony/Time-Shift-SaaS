import { useState } from "react"
import { Sparkles, Loader2 } from "lucide-react"
import { isAxiosError } from "axios"
import toast from "react-hot-toast"

import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { generateJobDraftAI, type AIJobDraftResponse } from "@/utils/api-request-functions"
import { Button } from "../ui/button"
import { useCompanyPlan } from "@/hooks/useCompanyPlan"
import { PlanLockBadge } from "@/components/billing/PlanLockBadge"

const EXAMPLE_PROMPT =
  "Two security guards at Tesco Extra next Friday, 6pm to 2am, £14/hr"

/**
 * Entry point for the AI job-creation assistant. Only ever produces a
 * *draft* — the prompt is sent to the backend, which returns structured
 * fields for the manager to review inside the normal wizard. Nothing is
 * created or saved here.
 */
export function AIJobDraftDialog({
  onDraftReady,
}: {
  onDraftReady: (response: AIJobDraftResponse) => void
}) {
  const [open, setOpen] = useState(false)
  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)

  // UI-only gate — a muted button so a Free/Starter manager isn't surprised
  // by a spent-credit request. The backend re-checks independently on every
  // call (aiController.ts -> assertFeatureEnabledForCompany), so this can't
  // be bypassed by devtools, only skipped past to a real 403.
  const { hasFeature } = useCompanyPlan()
  const canUseAI = hasFeature("aiJobAssistant")

  const handleGenerate = async () => {
    if (prompt.trim().length < 3) {
      toast.error("Describe the shift in a bit more detail.")
      return
    }
    setLoading(true)
    try {
      const response = await generateJobDraftAI(prompt.trim())
      onDraftReady(response)
      setOpen(false)
      setPrompt("")
    } catch (error) {
      const message = isAxiosError(error)
        ? error.response?.data?.msg ?? "Couldn't generate a draft — try again."
        : "Couldn't generate a draft — try again."
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="flex items-center gap-2 shrink-0">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 shrink-0"
          onClick={() => setOpen(true)}
          disabled={!canUseAI}
        >
          <Sparkles size={14} />
          Create with AI
        </Button>
        {!canUseAI && <PlanLockBadge label="Upgrade to unlock" />}
      </div>

      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles size={16} className="text-[var(--primary)]" />
            Create with AI
          </DialogTitle>
          <DialogDescription>
            Describe the shift in plain English — the AI will fill in what it can. You'll
            review and edit everything before publishing.
          </DialogDescription>
        </DialogHeader>

        <Textarea
          autoFocus
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder={EXAMPLE_PROMPT}
          rows={4}
          disabled={loading}
        />

        <DialogFooter>
          <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button type="button" size="sm" onClick={handleGenerate} disabled={loading} className="gap-1.5">
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? "Generating…" : "Generate draft"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
