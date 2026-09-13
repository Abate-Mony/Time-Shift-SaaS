import { useState } from 'react'
import type { Client } from '@/utils/types/client'
import type { Site } from '@/utils/types/site'

export interface SiteFormValues {
  name: string
  client: string
  addressLine1: string
  addressLine2: string
  city: string
  county: string
  postcode: string
  country: string
  geofenceEnabled: boolean
  geofenceMode: 'warn' | 'enforce'
  geofenceRadiusMeters: string
  contactName: string
  contactPhone: string
  contactEmail: string
  instructions: string
  accessInstructions: string
  parkingInstructions: string
}

export const emptySiteFormValues = (defaultClientId = ''): SiteFormValues => ({
  name: '',
  client: defaultClientId,
  addressLine1: '',
  addressLine2: '',
  city: '',
  county: '',
  postcode: '',
  country: 'United Kingdom',
  geofenceEnabled: false,
  geofenceMode: 'warn',
  geofenceRadiusMeters: '150',
  contactName: '',
  contactPhone: '',
  contactEmail: '',
  instructions: '',
  accessInstructions: '',
  parkingInstructions: '',
})

export const siteFormValuesFromSite = (site: Site): SiteFormValues => ({
  name: site.name,
  client: typeof site.client === 'string' ? site.client : site.client._id,
  addressLine1: site.address?.line1 ?? '',
  addressLine2: site.address?.line2 ?? '',
  city: site.address?.city ?? '',
  county: site.address?.county ?? '',
  postcode: site.address?.postcode ?? '',
  country: site.address?.country ?? 'United Kingdom',
  geofenceEnabled: !!site.geofenceMode && site.geofenceMode !== 'off',
  geofenceMode: site.geofenceMode === 'enforce' ? 'enforce' : 'warn',
  geofenceRadiusMeters: site.geofenceRadiusMeters ? String(site.geofenceRadiusMeters) : '150',
  contactName: site.contact?.name ?? '',
  contactPhone: site.contact?.phone ?? '',
  contactEmail: site.contact?.email ?? '',
  instructions: site.instructions ?? '',
  accessInstructions: site.accessInstructions ?? '',
  parkingInstructions: site.parkingInstructions ?? '',
})

// Only name/client are required server-side, and unknown keys are
// rejected — untouched optional fields must be omitted, not sent empty.
export const buildSitePayload = (v: SiteFormValues) => {
  const hasAddress = v.addressLine1 || v.addressLine2 || v.city || v.county || v.postcode
  return {
    name: v.name.trim(),
    client: v.client,
    address: hasAddress
      ? {
          line1: v.addressLine1.trim() || undefined,
          line2: v.addressLine2.trim() || undefined,
          city: v.city.trim() || undefined,
          county: v.county.trim() || undefined,
          postcode: v.postcode.trim() || undefined,
          country: v.country.trim() || undefined,
        }
      : undefined,
    geofenceMode: v.geofenceEnabled ? v.geofenceMode : "off" as const,
    geofenceRadiusMeters: v.geofenceEnabled && v.geofenceRadiusMeters
      ? parseInt(v.geofenceRadiusMeters, 10)
      : undefined,
    contact: (v.contactName || v.contactPhone || v.contactEmail)
      ? {
          name: v.contactName.trim() || undefined,
          phone: v.contactPhone.trim() || undefined,
          email: v.contactEmail.trim() || undefined,
        }
      : undefined,
    instructions: v.instructions.trim() || undefined,
    accessInstructions: v.accessInstructions.trim() || undefined,
    parkingInstructions: v.parkingInstructions.trim() || undefined,
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const inputClass =
  'w-full h-10 px-3 border border-[var(--border)] rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/15 focus:border-[var(--primary)]/40 transition-all'

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-foreground mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>}
    </div>
  )
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-xl border border-[var(--border)] p-6 min-w-0">
      <h2 className="text-sm font-bold text-foreground">{title}</h2>
      {description && <p className="text-xs text-muted-foreground mt-0.5 mb-4">{description}</p>}
      <div className={description ? '' : 'mt-4'}>{children}</div>
    </div>
  )
}

interface SiteFormProps {
  clients: Client[]
  initialValues?: SiteFormValues
  clientLocked?: boolean
  onSubmit: (values: SiteFormValues) => void
  submitting?: boolean
  submitLabel?: string
  onCancel: () => void
  errorMessage?: string | null
}

export function SiteForm({
  clients,
  initialValues,
  clientLocked,
  onSubmit,
  submitting,
  submitLabel = 'Create site',
  onCancel,
  errorMessage,
}: SiteFormProps) {
  const [values, setValues] = useState<SiteFormValues>(initialValues ?? emptySiteFormValues())
  const [touched, setTouched] = useState(false)

  const set = <K extends keyof SiteFormValues>(key: K) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setValues(v => ({ ...v, [key]: e.target.value }))

  const nameValid = values.name.trim().length > 0
  const clientValid = values.client.trim().length > 0
  const emailValid = !values.contactEmail.trim() || EMAIL_RE.test(values.contactEmail.trim())
  const valid = nameValid && clientValid && emailValid

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (valid) onSubmit(values)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 min-w-0">
      <Section title="Basic details">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
          <Field label="Site name *">
            <input
              value={values.name}
              onChange={set('name')}
              placeholder="e.g. Bristol Distribution Centre"
              className={inputClass}
            />
            {touched && !nameValid && <p className="text-xs text-red-500 mt-1">Site name is required.</p>}
          </Field>
          <Field label="Client *">
            <select
              value={values.client}
              onChange={set('client')}
              disabled={clientLocked}
              className={`${inputClass} bg-card cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              <option value="">Select a client…</option>
              {clients.map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
            {touched && !clientValid && <p className="text-xs text-red-500 mt-1">Select a client.</p>}
          </Field>
        </div>
      </Section>

      <Section title="Address" description="Where this site actually is — used for directions once a worker is assigned.">
        <div className="flex flex-col gap-4 min-w-0">
          <Field label="Address line 1">
            <input value={values.addressLine1} onChange={set('addressLine1')} placeholder="12 Example Street" className={inputClass} />
          </Field>
          <Field label="Address line 2">
            <input value={values.addressLine2} onChange={set('addressLine2')} placeholder="Unit 4" className={inputClass} />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
            <Field label="City / town">
              <input value={values.city} onChange={set('city')} placeholder="Bristol" className={inputClass} />
            </Field>
            <Field label="County">
              <input value={values.county} onChange={set('county')} placeholder="Avon" className={inputClass} />
            </Field>
            <Field label="Postcode">
              <input value={values.postcode} onChange={set('postcode')} placeholder="BS1 6XN" className={inputClass} />
            </Field>
            <Field label="Country">
              <input value={values.country} onChange={set('country')} placeholder="United Kingdom" className={inputClass} />
            </Field>
          </div>
        </div>
      </Section>

      <Section title="Geofence" description="Overrides your company's default clock-in radius for this site only.">
        <label className="flex items-center gap-2.5 cursor-pointer mb-4">
          <input
            type="checkbox"
            checked={values.geofenceEnabled}
            onChange={e => setValues(v => ({ ...v, geofenceEnabled: e.target.checked }))}
            className="w-4 h-4 rounded border-slate-300 text-[var(--primary)] focus:ring-[var(--primary)]/30"
          />
          <span className="text-sm font-medium text-foreground">Enable a custom geofence for this site</span>
        </label>
        {values.geofenceEnabled && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
            <Field label="Radius (metres)">
              <input
                type="number"
                min="25"
                max="5000"
                value={values.geofenceRadiusMeters}
                onChange={set('geofenceRadiusMeters')}
                className={inputClass}
              />
            </Field>
            <Field label="On breach" hint="Warn lets the clock-in proceed and flags it; Enforce blocks it.">
              <select value={values.geofenceMode} onChange={set('geofenceMode')} className={`${inputClass} bg-card cursor-pointer`}>
                <option value="warn">Warn</option>
                <option value="enforce">Enforce</option>
              </select>
            </Field>
          </div>
        )}
      </Section>

      <Section title="Site contact" description="Who a worker should contact if something's wrong on site.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
          <Field label="Name">
            <input value={values.contactName} onChange={set('contactName')} placeholder="James Smith" className={inputClass} />
          </Field>
          <Field label="Phone">
            <input value={values.contactPhone} onChange={set('contactPhone')} placeholder="07700 900123" className={inputClass} />
          </Field>
          <Field label="Email">
            <input type="email" value={values.contactEmail} onChange={set('contactEmail')} placeholder="james@client.co.uk" className={inputClass} />
            {touched && !emailValid && <p className="text-xs text-red-500 mt-1">Enter a valid email address.</p>}
          </Field>
        </div>
      </Section>

      <Section title="Worker instructions" description="Shown to workers on jobs scheduled at this site.">
        <div className="flex flex-col gap-4 min-w-0">
          <Field label="General instructions">
            <textarea
              value={values.instructions}
              onChange={set('instructions')}
              rows={3}
              placeholder="Anything a worker should know before their shift…"
              className="w-full px-3 py-2.5 border border-[var(--border)] rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/15 focus:border-[var(--primary)]/40 transition-all resize-none"
            />
          </Field>
          <Field label="Access instructions">
            <textarea
              value={values.accessInstructions}
              onChange={set('accessInstructions')}
              rows={2}
              placeholder="e.g. Enter through Gate B, ask for the site manager"
              className="w-full px-3 py-2.5 border border-[var(--border)] rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/15 focus:border-[var(--primary)]/40 transition-all resize-none"
            />
          </Field>
          <Field label="Parking instructions">
            <textarea
              value={values.parkingInstructions}
              onChange={set('parkingInstructions')}
              rows={2}
              placeholder="e.g. Rear staff car park, visitor bays only"
              className="w-full px-3 py-2.5 border border-[var(--border)] rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/15 focus:border-[var(--primary)]/40 transition-all resize-none"
            />
          </Field>
        </div>
      </Section>

      {errorMessage && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-3.5">
          <p className="text-sm text-red-700">{errorMessage}</p>
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pb-6">
        <button
          type="button"
          onClick={onCancel}
          className="h-10 px-5 text-sm font-semibold text-muted-foreground border border-[var(--border)] rounded-xl hover:bg-muted transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="h-10 px-6 text-sm font-bold bg-[var(--primary)] text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2"
        >
          {submitting ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…
            </>
          ) : (
            submitLabel
          )}
        </button>
      </div>
    </form>
  )
}
