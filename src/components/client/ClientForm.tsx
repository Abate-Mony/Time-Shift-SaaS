import { useState } from 'react'
import type { ChargeType, ClientStatus } from '@/utils/types/client'
import { ClientContactsEditor, emptyContact, type ClientContactDraft } from './ClientContactsEditor'

export interface ClientFormValues {
  name: string
  phone: string
  status: ClientStatus
  contacts: ClientContactDraft[]
  billingEmail: string
  vatNumber: string
  paymentTermsDays: string
  addressLine1: string
  addressLine2: string
  city: string
  county: string
  postcode: string
  country: string
  defaultChargeType: ChargeType
  defaultChargeRate: string
  notes: string
}

export const emptyClientFormValues = (): ClientFormValues => ({
  name: '',
  phone: '',
  status: 'active',
  contacts: [],
  billingEmail: '',
  vatNumber: '',
  paymentTermsDays: '30',
  addressLine1: '',
  addressLine2: '',
  city: '',
  county: '',
  postcode: '',
  country: 'United Kingdom',
  defaultChargeType: 'hourly',
  defaultChargeRate: '',
  notes: '',
})

// Only `name` is required server-side, and unknown keys are rejected —
// untouched optional fields must be omitted (undefined), not sent empty.
export const buildClientPayload = (v: ClientFormValues) => {
  const contacts = v.contacts
    .filter(c => c.name.trim() || c.email.trim() || c.phone.trim() || c.role.trim())
    .map(c => ({
      name: c.name.trim() || undefined,
      role: c.role.trim() || undefined,
      email: c.email.trim() || undefined,
      phone: c.phone.trim() || undefined,
      isPrimary: c.isPrimary,
    }))

  const hasAddress = v.addressLine1 || v.addressLine2 || v.city || v.county || v.postcode

  return {
    name: v.name.trim(),
    status: v.status,
    contacts: contacts.length ? contacts : undefined,
    phone: v.phone.trim() || undefined,
    billingEmail: v.billingEmail.trim() || undefined,
    vatNumber: v.vatNumber.trim() || undefined,
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
    defaultChargeType: v.defaultChargeType,
    defaultChargeRate: v.defaultChargeRate ? parseFloat(v.defaultChargeRate) : undefined,
    paymentTermsDays: v.paymentTermsDays ? parseInt(v.paymentTermsDays, 10) : undefined,
    notes: v.notes.trim() || undefined,
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const inputClass =
  'w-full h-10 px-3 border border-[#E2E8F0] rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/15 focus:border-[#1E3A5F]/40 transition-all'

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-slate-400 mt-1">{hint}</p>}
    </div>
  )
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 min-w-0">
      <h2 className="text-sm font-bold text-slate-900">{title}</h2>
      {description && <p className="text-xs text-slate-500 mt-0.5 mb-4">{description}</p>}
      <div className={description ? '' : 'mt-4'}>{children}</div>
    </div>
  )
}

interface ClientFormProps {
  onSubmit: (values: ClientFormValues) => void
  submitting?: boolean
  submitLabel?: string
  onCancel: () => void
  errorMessage?: string | null
}

export function ClientForm({ onSubmit, submitting, submitLabel = 'Create client', onCancel, errorMessage }: ClientFormProps) {
  const [values, setValues] = useState<ClientFormValues>(emptyClientFormValues)
  const [touched, setTouched] = useState(false)

  const set = <K extends keyof ClientFormValues>(key: K) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setValues(v => ({ ...v, [key]: e.target.value }))

  const nameValid = values.name.trim().length > 0
  const emailsValid =
    (!values.billingEmail.trim() || EMAIL_RE.test(values.billingEmail.trim())) &&
    values.contacts.every(c => !c.email.trim() || EMAIL_RE.test(c.email.trim()))
  const valid = nameValid && emailsValid

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (valid) onSubmit(values)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 min-w-0">
      <Section title="Client details">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
          <div className="sm:col-span-2">
            <Field label="Client name *">
              <input
                value={values.name}
                onChange={set('name')}
                placeholder="e.g. ABC Property Management"
                className={inputClass}
              />
              {touched && !nameValid && <p className="text-xs text-red-500 mt-1">Client name is required.</p>}
            </Field>
          </div>
          <Field label="Main phone">
            <input value={values.phone} onChange={set('phone')} placeholder="020 7946 0001" className={inputClass} />
          </Field>
          <Field label="Status">
            <select value={values.status} onChange={set('status')} className={`${inputClass} bg-white cursor-pointer`}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </Field>
        </div>
      </Section>

      <Section title="Contacts" description="Add the people your team should reach out to for this client.">
        <ClientContactsEditor
          contacts={values.contacts}
          onChange={contacts => setValues(v => ({ ...v, contacts }))}
        />
      </Section>

      <Section title="Billing" description="Used as defaults when invoicing this client.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
          <Field label="Billing email">
            <input
              type="email"
              value={values.billingEmail}
              onChange={set('billingEmail')}
              placeholder="accounts@client.co.uk"
              className={inputClass}
            />
            {touched && values.billingEmail.trim() && !EMAIL_RE.test(values.billingEmail.trim()) && (
              <p className="text-xs text-red-500 mt-1">Enter a valid email address.</p>
            )}
          </Field>
          <Field label="VAT number">
            <input value={values.vatNumber} onChange={set('vatNumber')} placeholder="GB123456789" className={inputClass} />
          </Field>
          <Field label="Payment terms (days)">
            <input
              type="number"
              min="0"
              value={values.paymentTermsDays}
              onChange={set('paymentTermsDays')}
              placeholder="30"
              className={inputClass}
            />
          </Field>
        </div>
      </Section>

      <Section title="Address" description="The client's business/billing address — not a job site.">
        <div className="flex flex-col gap-4 min-w-0">
          <Field label="Address line 1">
            <input value={values.addressLine1} onChange={set('addressLine1')} placeholder="14 Canary Wharf" className={inputClass} />
          </Field>
          <Field label="Address line 2">
            <input value={values.addressLine2} onChange={set('addressLine2')} placeholder="Suite 400" className={inputClass} />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
            <Field label="City / town">
              <input value={values.city} onChange={set('city')} placeholder="London" className={inputClass} />
            </Field>
            <Field label="County">
              <input value={values.county} onChange={set('county')} placeholder="Greater London" className={inputClass} />
            </Field>
            <Field label="Postcode">
              <input value={values.postcode} onChange={set('postcode')} placeholder="E14 5AB" className={inputClass} />
            </Field>
            <Field label="Country">
              <input value={values.country} onChange={set('country')} placeholder="United Kingdom" className={inputClass} />
            </Field>
          </div>
        </div>
      </Section>

      <Section title="Default charging" description="This prefills new jobs for this client. Managers can override it on each job.">
        <div className="flex flex-col sm:flex-row gap-3 mb-4 min-w-0">
          {(
            [
              { value: 'hourly', label: 'Hourly', sub: 'Prefill new jobs with an hourly client rate' },
              { value: 'fixed', label: 'Fixed', sub: 'Prefill new jobs with a fixed client charge' },
            ] as const
          ).map(opt => (
            <label
              key={opt.value}
              className={`flex-1 min-w-0 flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                values.defaultChargeType === opt.value ? 'border-[#1E3A5F] bg-[#1E3A5F]/[0.03]' : 'border-[#E2E8F0] hover:border-slate-300'
              }`}
            >
              <input
                type="radio"
                name="defaultChargeType"
                className="sr-only"
                checked={values.defaultChargeType === opt.value}
                onChange={() => setValues(v => ({ ...v, defaultChargeType: opt.value }))}
              />
              <span
                className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                  values.defaultChargeType === opt.value ? 'border-[#1E3A5F] bg-[#1E3A5F]' : 'border-slate-300'
                }`}
              >
                {values.defaultChargeType === opt.value && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-slate-800">{opt.label}</span>
                <span className="block text-[11px] text-slate-400 mt-0.5">{opt.sub}</span>
              </span>
            </label>
          ))}
        </div>
        <div className="max-w-xs min-w-0">
          <Field label={values.defaultChargeType === 'hourly' ? 'Default hourly rate' : 'Default fixed charge'}>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">£</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={values.defaultChargeRate}
                onChange={set('defaultChargeRate')}
                placeholder={values.defaultChargeType === 'hourly' ? '30.00' : '250.00'}
                className={`${inputClass} pl-7`}
              />
            </div>
          </Field>
        </div>
      </Section>

      <Section title="Notes" description="Visible to managers and admins only.">
        <textarea
          value={values.notes}
          onChange={set('notes')}
          rows={3}
          placeholder="Internal notes about this client…"
          className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/15 focus:border-[#1E3A5F]/40 transition-all resize-none"
        />
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
          className="h-10 px-5 text-sm font-semibold text-slate-600 border border-[#E2E8F0] rounded-xl hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="h-10 px-6 text-sm font-bold bg-[#1E3A5F] text-white rounded-xl hover:bg-[#162D4A] disabled:opacity-50 transition-colors flex items-center gap-2"
        >
          {submitting ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating…
            </>
          ) : (
            submitLabel
          )}
        </button>
      </div>
    </form>
  )
}
