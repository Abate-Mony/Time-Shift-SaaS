import { useNavigate } from "react-router"
import { useQuery } from "@tanstack/react-query"
import { ChevronLeft, Globe, Mail, MessageCircle, Phone, UserX } from "lucide-react"

import { getMyContacts } from "@/utils/api-request-functions"
import { Avatar } from "@/components/ui"
import { Skeleton } from "@/components/ui/skeleton"
import type { ManagerContact } from "@/utils/types"

const ROLE_LABEL: Record<ManagerContact["role"], string> = {
  manager: "Manager",
  admin: "Admin",
  owner: "Owner",
}

const contactsQuery = {
  queryKey: ["my-contacts"],
  queryFn: getMyContacts,
}

export const loader = async () => null

// Phone numbers arrive formatted however someone typed them; tel:/sms: need
// just the digits (and a leading +).
const dialable = (phone: string) => phone.replace(/[^\d+]/g, "")

function ContactActions({ phone, email }: { phone?: string | null; email?: string | null }) {
  return (
    <div className="flex gap-2 mt-3">
      <a
        href={phone ? `tel:${dialable(phone)}` : undefined}
        className={`flex-1 h-9 rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold transition-colors ${phone ? "bg-blue-50 text-[var(--primary)] hover:bg-blue-100" : "bg-muted text-slate-300 pointer-events-none"}`}
      >
        <Phone size={13} /> Call
      </a>
      <a
        href={phone ? `sms:${dialable(phone)}` : undefined}
        className={`flex-1 h-9 rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold transition-colors ${phone ? "bg-blue-50 text-[var(--primary)] hover:bg-blue-100" : "bg-muted text-slate-300 pointer-events-none"}`}
      >
        <MessageCircle size={13} /> Text
      </a>
      <a
        href={email ? `mailto:${email}` : undefined}
        className={`flex-1 h-9 rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold transition-colors ${email ? "bg-blue-50 text-[var(--primary)] hover:bg-blue-100" : "bg-muted text-slate-300 pointer-events-none"}`}
      >
        <Mail size={13} /> Email
      </a>
    </div>
  )
}

export default function ContactManagerScreen() {
  const navigate = useNavigate()
  const { data, isLoading } = useQuery(contactsQuery)
  const company = data?.company
  const managers = data?.managers ?? []

  return (
    <div className="flex flex-col gap-4 pb-4 animate-fade-in">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors -mb-1"
      >
        <ChevronLeft size={16} />
        Back
      </button>

      <div>
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center">
            <Phone size={15} className="text-muted-foreground" />
          </span>
          Contact Manager
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          {company ? `Get in touch with the team at ${company.name}` : "Get in touch with your team"}
        </p>
      </div>

      {isLoading ? (
        <div className="bg-card rounded-2xl border border-[var(--border)] shadow-sm p-4 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full shrink-0" />
            <div className="flex-1 flex flex-col gap-1.5">
              <Skeleton className="h-3.5 w-2/5" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
          <Skeleton className="h-9 w-full rounded-lg" />
        </div>
      ) : (
        <>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Your managers</p>
          {managers.length === 0 ? (
            <div className="bg-card rounded-2xl border border-[var(--border)] shadow-sm p-4 flex items-center gap-3">
              <UserX size={18} className="text-muted-foreground shrink-0" />
              <p className="text-sm text-muted-foreground">No managers are listed for your company yet.</p>
            </div>
          ) : (
            managers.map(m => (
              <div key={m._id} className="bg-card rounded-2xl border border-[var(--border)] shadow-sm p-4">
                <div className="flex items-center gap-3">
                  <Avatar initials={m.fullname.slice(0, 2).toUpperCase()} src={m.photoUrl} size="md" index={0} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-foreground truncate">{m.fullname}</p>
                      <span className="text-[10px] font-bold text-[var(--primary)] bg-blue-50 rounded-full px-2 py-0.5 shrink-0">
                        {ROLE_LABEL[m.role] ?? m.role}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {[m.phone, m.email].filter(Boolean).join(" · ") || "No contact details added yet"}
                    </p>
                  </div>
                </div>
                <ContactActions phone={m.phone} email={m.email} />
              </div>
            ))
          )}

          {company && (company.phone || company.website) && (
            <>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mt-2">Company</p>
              <div className="bg-card rounded-2xl border border-[var(--border)] shadow-sm p-4">
                <div className="flex items-center gap-3">
                  <Avatar initials={company.name.slice(0, 2).toUpperCase()} src={company.logoUrl} size="md" index={0} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{company.name}</p>
                    {!!company.phone && <p className="text-xs text-muted-foreground mt-0.5">{company.phone}</p>}
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <a
                    href={company.phone ? `tel:${dialable(company.phone)}` : undefined}
                    className={`flex-1 h-9 rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold transition-colors ${company.phone ? "bg-blue-50 text-[var(--primary)] hover:bg-blue-100" : "bg-muted text-slate-300 pointer-events-none"}`}
                  >
                    <Phone size={13} /> Call office
                  </a>
                  {!!company.website && (
                    <a
                      href={/^https?:\/\//i.test(company.website) ? company.website : `https://${company.website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 h-9 rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold bg-blue-50 text-[var(--primary)] hover:bg-blue-100 transition-colors"
                    >
                      <Globe size={13} /> Website
                    </a>
                  )}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
