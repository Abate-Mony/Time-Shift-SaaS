import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ChevronLeft } from 'lucide-react'
import customFetch from '@/utils/customFetch'
import { queryClient } from '@/lib/queryClient'
import { clientsQuery } from '@/utils/clients'
import type { Client } from '@/utils/types/client'
import type { Site } from '@/utils/types/site'
import { SiteForm, buildSitePayload, emptySiteFormValues, type SiteFormValues } from '@/components/site/SiteForm'

export function CreateSitePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preselectedClient = searchParams.get('client') ?? ''
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { clients } = useQuery(clientsQuery()).data as { clients: Client[] }

  const handleSubmit = async (values: SiteFormValues) => {
    setSubmitting(true)
    setErrorMessage(null)
    try {
      const { data } = await customFetch.post<{ site: Site }>('/sites', buildSitePayload(values))
      toast.success('Site created successfully')
      await queryClient.invalidateQueries({ queryKey: ['sites'] })
      if (values.client) await queryClient.invalidateQueries({ queryKey: ['client-sites', values.client] })
      navigate(`/sites/${data.site._id}`)
    } catch (err: any) {
      setErrorMessage(err.response?.data?.msg ?? 'Failed to create site.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto min-w-0">
      <div className="flex items-center gap-3 mb-6 min-w-0">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors shrink-0"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-foreground tracking-tight truncate">Add site</h1>
          <p className="text-sm text-muted-foreground mt-0.5 truncate">
            Use sites for places your team visits repeatedly. Use a one-off location for ad-hoc work.
          </p>
        </div>
      </div>

      <SiteForm
        clients={clients}
        initialValues={emptySiteFormValues(preselectedClient)}
        clientLocked={!!preselectedClient}
        onSubmit={handleSubmit}
        submitting={submitting}
        onCancel={() => navigate(-1)}
        errorMessage={errorMessage}
      />
    </div>
  )
}
