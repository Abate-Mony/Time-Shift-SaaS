import { ArrowLeft, ArrowRight, Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DRAFT_AVAILABLE_FROM_STEP, TOTAL_STEPS } from "./wizardConfig"

interface Props {
  currentStep: number
  isSubmitting: boolean
  submittingAs: "draft" | "published" | null
  onBack: () => void
  onNext: () => void
  onSaveDraft: () => void
  onPublish: () => void
  onCancel: () => void
}

export function WizardFooter({
  currentStep,
  isSubmitting,
  submittingAs,
  onBack,
  onNext,
  onSaveDraft,
  onPublish,
  onCancel,
}: Props) {
  const isReview = currentStep === TOTAL_STEPS
  const canSaveDraft = currentStep >= DRAFT_AVAILABLE_FROM_STEP

  return (
    <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3 pt-2 pb-6 min-w-0">
      <div className="flex items-center gap-3 min-w-0">
        {currentStep > 1 ? (
          <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>
            <ArrowLeft size={15} /> Back
          </Button>
        ) : (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-3 justify-end min-w-0">
        {/* Available from step 3 — by then the job has enough on it to be
            worth coming back to */}
        {canSaveDraft && (
          <Button
            type="button"
            variant="secondary"
            onClick={onSaveDraft}
            disabled={isSubmitting}
          >
            {submittingAs === "draft" ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Save size={15} /> Save as draft
              </>
            )}
          </Button>
        )}

        {isReview ? (
          <Button type="button" onClick={onPublish} disabled={isSubmitting}>
            {submittingAs === "published" ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Publishing…
              </>
            ) : (
              "Publish job"
            )}
          </Button>
        ) : (
          <Button type="button" onClick={onNext} disabled={isSubmitting}>
            Next <ArrowRight size={15} />
          </Button>
        )}
      </div>
    </div>
  )
}
