import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import toast from 'react-hot-toast'
import { Sparkles, Send, Loader2, Bot, User, Briefcase, Receipt, FileText, SquareUser, UserRound } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useCompanyPlan } from '@/hooks/useCompanyPlan'
import { PlanLockBadge } from '@/components/billing/PlanLockBadge'
import { backLinkState } from '@/hooks/useBackLink'
import { queryClient } from '@/lib/queryClient'
import { sendDataAssistantMessage, type AIDataAssistantTurn } from '@/utils/api-request-functions'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

// Keeping the thread in the shared React Query cache (rather than this
// component's own useState) is what lets it survive navigating away and
// back — e.g. clicking a job reference, then returning to /assistant. The
// cache lives in memory for the life of the tab, so it still clears on an
// actual page reload, same as before.
const THREAD_QUERY_KEY = ['data-assistant-thread']

// The assistant tags one specific, actionable record it names (an
// unstaffed job, an overdue invoice, ...) as ⟦type:id|label⟧ — see the
// backend's SYSTEM_PROMPT in dataAssistantChat.ts. Parsed back out here
// into a clickable chip so "that job" is something you can actually open,
// not just read about.
type RefType = 'job' | 'invoice' | 'quote' | 'client' | 'worker'

const REF_REGEX = /⟦(job|invoice|quote|client|worker):([a-f0-9]{24})\|([^⟧]+)⟧/g

const REF_ROUTES: Record<RefType, (id: string) => string> = {
  job: id => `/jobs/${id}`,
  invoice: id => `/invoices/${id}`,
  quote: id => `/quotes/${id}`,
  client: id => `/clients/${id}`,
  worker: id => `/workers/${id}/worker-profile`,
}

const REF_ICONS: Record<RefType, typeof Briefcase> = {
  job: Briefcase,
  invoice: Receipt,
  quote: FileText,
  client: SquareUser,
  worker: UserRound,
}

function EntityChip({ type, id, label, tone }: { type: RefType; id: string; label: string; tone: 'user' | 'assistant' }) {
  const navigate = useNavigate()
  const Icon = REF_ICONS[type]
  return (
    <button
      type="button"
      onClick={() => navigate(REF_ROUTES[type](id), { state: backLinkState('Assistant') })}
      className={`inline-flex items-center gap-1 mx-0.5 px-1.5 py-0.5 rounded-md text-[13px] font-semibold underline decoration-dotted underline-offset-2 align-baseline transition-colors ${tone === 'user'
        ? 'text-white hover:bg-white/15'
        : 'text-[var(--primary)] hover:bg-[var(--primary)]/10'
        }`}
    >
      <Icon size={11} className="shrink-0" />
      {label}
    </button>
  )
}

// Splits a reply into plain-text spans and clickable EntityChips wherever
// the assistant tagged a specific record — everything else renders exactly
// as the model wrote it.
function MessageContent({ content, tone }: { content: string; tone: 'user' | 'assistant' }) {
  const regex = new RegExp(REF_REGEX)
  const parts: ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = 0

  while ((match = regex.exec(content))) {
    if (match.index > lastIndex) parts.push(<span key={key++}>{content.slice(lastIndex, match.index)}</span>)
    const [, type, id, label] = match
    parts.push(<EntityChip key={key++} type={type as RefType} id={id} label={label} tone={tone} />)
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < content.length) parts.push(<span key={key++}>{content.slice(lastIndex)}</span>)

  return <>{parts}</>
}

const SUGGESTIONS = [
  'How many jobs are scheduled this week?',
  'Which invoices are overdue?',
  'How many active workers do we have?',
  "What's our outstanding balance?",
]

// Read-only Q&A over the company's own jobs/invoices/quotes/clients/workers —
// see the backend's dataAssistantTools.ts for exactly what it can and can't
// see (never contact details, pay rates, or identifying documents, and
// never another company's data). The thread survives in-app navigation
// (see THREAD_QUERY_KEY above) but not a real page reload — history still
// only ever rides along with each request, never persisted server-side.
export function DataAssistant() {
  const { hasFeature } = useCompanyPlan()
  const canUseAI = hasFeature('aiDataAssistant')

  const { data: messages = [] } = useQuery<ChatMessage[]>({
    queryKey: THREAD_QUERY_KEY,
    queryFn: () => [],
    staleTime: Infinity,
    gcTime: Infinity,
  })
  const setMessages = (updater: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) =>
    queryClient.setQueryData<ChatMessage[]>(THREAD_QUERY_KEY, prev =>
      typeof updater === 'function' ? updater(prev ?? []) : updater
    )

  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, sending])

  const handleSend = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || sending) return

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: trimmed }]
    setMessages(nextMessages)
    setInput('')
    setSending(true)

    try {
      const history: AIDataAssistantTurn[] = messages.slice(-12)
      const { reply } = await sendDataAssistantMessage(trimmed, history)
      setMessages(m => [...m, { role: 'assistant', content: reply }])
    } catch (error) {
      const message = isAxiosError(error)
        ? error.response?.data?.msg ?? "Couldn't get an answer — try again."
        : "Couldn't get an answer — try again."
      toast.error(message)
      setMessages(m => m.slice(0, -1))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="px-2 sm:px-4 lg:p-6 animate-fade-in flex flex-col h-[calc(100svh-5rem)] lg:h-[calc(100svh-3rem)]">
      <div className="flex items-start justify-between mb-6 gap-2">
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight flex items-center gap-2">
            <Sparkles size={18} className="text-[var(--primary)]" />
            Data Assistant
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Ask about your jobs, invoices, quotes, clients, and workers.</p>
        </div>
        {!canUseAI && <PlanLockBadge label="Upgrade to unlock" />}
      </div>

      <div className="flex-1 min-h-0 bg-card rounded-xl border border-[var(--border)] flex flex-col overflow-hidden">
        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto p-4 flex flex-col gap-3">
          {messages.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
              <div className="w-11 h-11 rounded-xl bg-[var(--primary)]/8 flex items-center justify-center mb-3">
                <Sparkles size={18} className="text-[var(--primary)]" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">Ask a question about your data</p>
              <p className="text-xs text-muted-foreground max-w-xs mb-4">
                It only reads real, live numbers scoped to your company — no contact details, pay rates, or personal documents.
              </p>
              <div className="flex flex-col gap-1.5 w-full max-w-xs">
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSend(s)}
                    disabled={!canUseAI}
                    className="text-left text-xs px-3 py-2 rounded-lg border border-[var(--border)] text-muted-foreground hover:text-foreground hover:border-slate-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex items-start gap-2.5 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-[var(--primary)]/10' : 'bg-muted'}`}>
                {m.role === 'user' ? <User size={13} className="text-[var(--primary)]" /> : <Bot size={13} className="text-muted-foreground" />}
              </div>
              <div
                className={`max-w-[75%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${m.role === 'user'
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-muted text-foreground'
                  }`}
              >
                <MessageContent content={m.content} tone={m.role} />
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Bot size={13} className="text-muted-foreground" />
              </div>
              <div className="bg-muted rounded-xl px-3.5 py-2.5 text-sm text-muted-foreground flex items-center gap-1.5">
                <Loader2 size={13} className="animate-spin" /> Thinking…
              </div>
            </div>
          )}
        </div>

        <form
          onSubmit={e => {
            e.preventDefault()
            handleSend(input)
          }}
          className="flex items-center gap-2 p-3 border-t border-[var(--border)]"
        >
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={canUseAI ? 'Ask about jobs, invoices, quotes, clients, workers…' : 'Upgrade your plan to use the data assistant'}
            disabled={!canUseAI || sending}
            className="flex-1 h-10 px-3 border border-[var(--border)] rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/15 focus:border-[var(--primary)]/40 transition-all disabled:opacity-50"
          />
          <Button type="submit" size="icon-lg" disabled={!canUseAI || sending || !input.trim()}>
            {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          </Button>
        </form>
      </div>
    </div>
  )
}
