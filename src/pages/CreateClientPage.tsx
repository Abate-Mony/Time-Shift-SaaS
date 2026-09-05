import { useState } from 'react'
import { useNavigate } from 'react-router'
import toast from 'react-hot-toast'
import { ChevronLeft } from 'lucide-react'
import customFetch from '@/utils/customFetch'
import { queryClient } from '@/lib/queryClient'
import { findClientByExactName, isDuplicateClientError } from '@/utils/clients'
import type { Client } from '@/utils/types/client'
import { ClientForm, buildClientPayload, type ClientFormValues } from '@/components/client/ClientForm'

export function CreateClientPage() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [duplicate, setDuplicate] = useState<Client | null>(null)

  const handleSubmit = async (values: ClientFormValues) => {
    setSubmitting(true)
    setErrorMessage(null)
    setDuplicate(null)
    try {
      const { data } = await customFetch.post<{ client: Client }>('/clients', buildClientPayload(values))
      toast.success('Client created successfully')
      await queryClient.invalidateQueries({ queryKey: ['clients'] })
      navigate(`/clients/${data.client._id}`)
    } catch (err: any) {
      const msg: string | undefined = err.response?.data?.msg
      if (isDuplicateClientError(msg)) {
        const existing = await findClientByExactName(values.name)
        if (existing) {
          setDuplicate(existing)
        } else {
          setErrorMessage(msg ?? 'Failed to create client.')
        }
      } else {
        setErrorMessage(msg ?? 'Failed to create client.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto min-w-0">
      <div className="flex items-center gap-3 mb-6 min-w-0">
        <button
          type="button"
          onClick={() => navigate('/clients')}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors shrink-0"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight truncate">Add client</h1>
          <p className="text-sm text-slate-500 mt-0.5 truncate">
            Add a customer account and its contact, billing and default charging details.
          </p>
        </div>
      </div>

      {duplicate && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 flex flex-col sm:flex-row sm:items-center gap-3 min-w-0">
          <p className="text-sm text-amber-900 flex-1 min-w-0">
            A client named <span className="font-semibold">{duplicate.name}</span> already exists.
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setDuplicate(null)}
              className="h-8 px-3 text-xs font-semibold text-amber-800 border border-amber-300 rounded-lg hover:bg-amber-100 transition-colors"
            >
              Dismiss
            </button>
            <button
              type="button"
              onClick={() => navigate(`/clients/${duplicate._id}`)}
              className="h-8 px-3 text-xs font-bold text-white bg-amber-500 rounded-lg hover:bg-amber-600 transition-colors"
            >
              Use existing client
            </button>
          </div>
        </div>
      )}

      <ClientForm
        onSubmit={handleSubmit}
        submitting={submitting}
        onCancel={() => navigate('/clients')}
        errorMessage={duplicate ? null : errorMessage}
      />
    </div>
  )
}
