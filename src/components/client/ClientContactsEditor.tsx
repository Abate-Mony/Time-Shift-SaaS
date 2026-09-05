import { Plus, Trash2 } from 'lucide-react'

export interface ClientContactDraft {
  name: string
  role: string
  email: string
  phone: string
  isPrimary: boolean
}

export const emptyContact = (isPrimary = false): ClientContactDraft => ({
  name: '', role: '', email: '', phone: '', isPrimary,
})

const inputClass =
  'w-full h-9 px-3 border border-[#E2E8F0] rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/15 focus:border-[#1E3A5F]/40 transition-all'

/**
 * A repeatable contact list. The backend hard-rejects more than one contact
 * marked `isPrimary` (see clientModel.ts's pre-validate hook), so "Primary"
 * is a radio, not a checkbox — selecting one always deselects the rest,
 * there's no way to end up with two, or to need to manually uncheck the old
 * one first.
 */
export function ClientContactsEditor({
  contacts,
  onChange,
}: {
  contacts: ClientContactDraft[]
  onChange: (next: ClientContactDraft[]) => void
}) {
  const update = (index: number, patch: Partial<ClientContactDraft>) => {
    onChange(contacts.map((c, i) => (i === index ? { ...c, ...patch } : c)))
  }

  const setPrimary = (index: number) => {
    onChange(contacts.map((c, i) => ({ ...c, isPrimary: i === index })))
  }

  const remove = (index: number) => {
    const wasPrimary = contacts[index]?.isPrimary
    const next = contacts.filter((_, i) => i !== index)
    // Keep exactly one primary reflected in the UI when one exists, so the
    // form never silently submits with nobody marked primary even though a
    // contact remains — mirrors the backend's own auto-first-primary fallback.
    if (wasPrimary && next.length > 0 && !next.some(c => c.isPrimary)) {
      next[0] = { ...next[0], isPrimary: true }
    }
    onChange(next)
  }

  const add = () => {
    onChange([...contacts, emptyContact(contacts.length === 0)])
  }

  return (
    <div className="flex flex-col gap-3">
      {contacts.map((contact, i) => (
        <div key={i} className="border border-[#E2E8F0] rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
              <input
                type="radio"
                name="primary-contact"
                checked={contact.isPrimary}
                onChange={() => setPrimary(i)}
                className="accent-[#1E3A5F]"
              />
              Primary contact
            </label>
            <button
              type="button"
              onClick={() => remove(i)}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
              aria-label="Remove contact"
            >
              <Trash2 size={13} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">Name</label>
              <input
                value={contact.name}
                onChange={e => update(i, { name: e.target.value })}
                placeholder="Sarah Williams"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">Role</label>
              <input
                value={contact.role}
                onChange={e => update(i, { role: e.target.value })}
                placeholder="Site Manager"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">Email</label>
              <input
                type="email"
                value={contact.email}
                onChange={e => update(i, { email: e.target.value })}
                placeholder="sarah@client.co.uk"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">Phone</label>
              <input
                value={contact.phone}
                onChange={e => update(i, { phone: e.target.value })}
                placeholder="+44 7700 900000"
                className={inputClass}
              />
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="self-start flex items-center gap-1.5 text-sm font-semibold text-[#1E3A5F] hover:opacity-75 transition-opacity"
      >
        <Plus size={13} /> Add contact
      </button>
    </div>
  )
}
