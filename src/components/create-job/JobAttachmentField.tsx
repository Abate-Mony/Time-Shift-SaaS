import { useRef, useState } from "react"
import { Paperclip, X, FileText, Image as ImageIcon } from "lucide-react"

const ACCEPTED = "image/jpeg,image/png,image/webp,application/pdf"

// A plain, uncontrolled file input — deliberately NOT inside a step
// component. AnimatePresence remounts the current step on every step
// change (key={currentStep}), which would wipe out a selected file; this
// lives alongside CreateJobHiddenFields, mounted once for the whole wizard,
// for the same reason those exist (React Router scrapes the DOM <form> for
// FormData at submit time, so the element just needs to still be there).
export function JobAttachmentField() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  const handleChange = () => {
    const file = inputRef.current?.files?.[0]
    setFileName(file ? file.name : null)
  }

  const clear = () => {
    if (inputRef.current) inputRef.current.value = ""
    setFileName(null)
  }

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 mb-6 min-w-0">
      <h2 className="text-sm font-semibold text-slate-800 mb-1">Attachment (optional)</h2>
      <p className="text-xs text-slate-500 mb-3">
        A photo or PDF that assigned workers can view — e.g. a door passcode or access instructions.
      </p>
      <div className="flex items-center gap-3 min-w-0 flex-wrap">
        <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 border border-[#E2E8F0] rounded-lg px-3 py-2 cursor-pointer hover:bg-slate-50 transition-colors shrink-0">
          <Paperclip size={14} />
          {fileName ? "Change file" : "Choose file"}
          <input
            ref={inputRef}
            type="file"
            name="attachment"
            accept={ACCEPTED}
            className="sr-only"
            onChange={handleChange}
          />
        </label>
        {fileName && (
          <div className="flex items-center gap-1.5 min-w-0 bg-slate-50 border border-[#E2E8F0] rounded-lg px-2.5 py-1.5">
            {fileName.toLowerCase().endsWith(".pdf") ? (
              <FileText size={14} className="text-slate-400 shrink-0" />
            ) : (
              <ImageIcon size={14} className="text-slate-400 shrink-0" />
            )}
            <span className="text-xs text-slate-600 truncate max-w-[220px]">{fileName}</span>
            <button type="button" onClick={clear} className="text-slate-400 hover:text-slate-600 shrink-0">
              <X size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
