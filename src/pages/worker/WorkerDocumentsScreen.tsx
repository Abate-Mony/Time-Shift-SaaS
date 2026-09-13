import { useRef, useState } from "react"
import { useNavigate } from "react-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { isAxiosError } from "axios"
import { ChevronLeft, FileText, Image as ImageIcon, Loader2, Paperclip, Trash2, Upload } from "lucide-react"

import { deleteMyDocument, getMyDocuments, uploadMyDocument } from "@/utils/api-request-functions"

const documentsQuery = {
  queryKey: ["my-documents"],
  queryFn: getMyDocuments,
}

export const loader = async () => null

export default function WorkerDocumentsScreen() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [docName, setDocName] = useState("")

  const { data: documents = [], isLoading } = useQuery(documentsQuery)

  const uploadMutation = useMutation({
    mutationFn: uploadMyDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-documents"] })
      toast.success("Document uploaded")
      setPendingFile(null)
      setDocName("")
      if (inputRef.current) inputRef.current.value = ""
    },
    onError: (error) => {
      const message = isAxiosError(error) ? error.response?.data?.msg ?? "Couldn't upload — try again." : "Couldn't upload — try again."
      toast.error(message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteMyDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-documents"] })
      toast.success("Document removed")
    },
    onError: () => toast.error("Couldn't remove the document — try again."),
  })

  const handleFileChange = () => {
    const file = inputRef.current?.files?.[0]
    if (!file) return
    setPendingFile(file)
    // Default the name from the filename (without extension) so most workers
    // never have to type anything — they can still rename it before uploading.
    if (!docName) setDocName(file.name.replace(/\.[^/.]+$/, ""))
  }

  const handleUpload = () => {
    if (!pendingFile) return
    if (!docName.trim()) {
      toast.error("Give the document a name.")
      return
    }
    uploadMutation.mutate({ name: docName.trim(), file: pendingFile })
  }

  return (
    <div className="flex flex-col gap-4 pb-4 animate-fade-in">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors -mb-1"
      >
        <ChevronLeft size={16} />
        Back
      </button>

      <div>
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
            <Paperclip size={15} className="text-slate-500" />
          </span>
          My Documents
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Optional — upload ID, right-to-work, certifications, or anything else your manager may ask for.
        </p>
      </div>

      {/* Upload */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-sm flex flex-col gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="sr-only"
          onChange={handleFileChange}
        />
        {!pendingFile ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex items-center justify-center gap-2 border border-dashed border-[#CBD5E1] rounded-xl py-4 text-sm font-medium text-slate-500 hover:bg-slate-50 transition-colors"
          >
            <Upload size={14} />
            Choose a file to upload
          </button>
        ) : (
          <>
            <div className="flex items-center gap-2 bg-slate-50 border border-[#E2E8F0] rounded-xl px-3 py-2.5">
              <FileText size={14} className="text-slate-400 shrink-0" />
              <span className="text-xs text-slate-600 truncate flex-1">{pendingFile.name}</span>
            </div>
            <input
              type="text"
              value={docName}
              onChange={e => setDocName(e.target.value)}
              placeholder="Document name (e.g. Passport, DBS Certificate)"
              className="w-full text-sm border border-[#E2E8F0] rounded-xl px-3 py-2.5 outline-none focus:border-slate-400"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setPendingFile(null); setDocName(""); if (inputRef.current) inputRef.current.value = "" }}
                className="flex-1 h-10 rounded-xl border border-[#E2E8F0] text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={uploadMutation.isPending}
                className="flex-1 h-10 rounded-xl bg-[#1E3A5F] text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {uploadMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                {uploadMutation.isPending ? "Uploading…" : "Upload"}
              </button>
            </div>
          </>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <p className="text-sm text-slate-400 text-center py-6">Loading…</p>
      ) : documents.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-6">No documents uploaded yet.</p>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm divide-y divide-[#F8FAFC]">
          {documents.map(doc => (
            <div key={doc._id} className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                {doc.mimeType === "application/pdf" ? (
                  <FileText size={14} className="text-slate-500" />
                ) : (
                  <ImageIcon size={14} className="text-slate-500" />
                )}
              </div>
              <a
                href={doc.url}
                target="_blank"
                rel="noreferrer"
                className="flex-1 min-w-0"
              >
                <p className="text-sm font-semibold text-slate-800 truncate">{doc.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {new Date(doc.uploadedAt).toLocaleDateString()}
                </p>
              </a>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(doc._id)}
                disabled={deleteMutation.isPending}
                className="text-slate-300 hover:text-rose-500 transition-colors shrink-0"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
