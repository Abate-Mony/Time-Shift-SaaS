import { useEffect, useMemo, useRef, useState, type DragEvent, type ReactNode } from 'react'
import { Link, useOutletContext } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
    AlignLeft, ArrowLeft, CalendarDays, Check, CheckCircle2,
    CircleDot, ClipboardList, Copy, Eye, FileText, GripVertical, Hash,
    HelpCircle, Home, Layers3, Loader2, MoreHorizontal, Pencil, Plus,
    Send, ShieldCheck, Sparkles, Trash2, UserRound, UsersRound, X,
} from 'lucide-react'
import toast from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import { Badge, Card, Input, Select, Textarea } from '@/components/ui'
import type { iUser } from '@/layouts/dashboardlayout'
import { isAdminRole } from '@/utils/roles'
import { getPublicQuoteLink, getQuoteWorkflow, publishQuoteWorkflow, saveQuoteWorkflowDraft } from '@/utils/api-request-functions'
import type { QuoteStepType, QuoteWorkflowServiceType, QuoteWorkflowStep } from '@/utils/types/quoteWorkflow'

const uid = () => Math.random().toString(36).slice(2, 9)
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

const typeLabels: Record<QuoteStepType, string> = {
    choice: 'Single choice', multiselect: 'Multiple choice', number: 'Number',
    text: 'Short text', textarea: 'Long text', date: 'Date', contact: 'Contact details',
}

function StepTypeIcon({ type, size = 'md' }: { type: QuoteStepType; size?: 'sm' | 'md' }) {
    const icons = { choice: CircleDot, multiselect: Layers3, number: Hash, text: FileText, textarea: AlignLeft, date: CalendarDays, contact: UserRound }
    const Icon = icons[type]
    return (
        <span className={`shrink-0 rounded-lg bg-muted text-muted-foreground flex items-center justify-center ${size === 'sm' ? 'w-7 h-7' : 'w-9 h-9'}`}>
            <Icon size={size === 'sm' ? 13 : 16} />
        </span>
    )
}

function Modal({ children, onClose, wide = false }: { children: ReactNode; onClose: () => void; wide?: boolean }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onMouseDown={e => e.target === e.currentTarget && onClose()}>
            <div className={`bg-card rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto animate-fade-in ${wide ? 'w-full max-w-5xl' : 'w-full max-w-lg'}`}>
                {children}
            </div>
        </div>
    )
}

function ModalHeader({ title, description, onClose }: { title: string; description?: string; onClose: () => void }) {
    return (
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-border">
            <div>
                <p className="text-base font-semibold text-foreground">{title}</p>
                {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
            </div>
            <button type="button" onClick={onClose} aria-label="Close" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground transition-colors shrink-0">
                <X size={16} />
            </button>
        </div>
    )
}

function StatusStrip({ dirty, onPreview, onPublish, publishing }: { dirty: boolean; onPreview: () => void; onPublish: () => void; publishing: boolean }) {
    return (
        <div className={`rounded-xl border px-4 py-3 flex items-center justify-between gap-4 ${dirty ? 'bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/30' : 'bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30'}`}>
            <div className="flex items-center gap-2.5">
                {dirty ? <span className="w-2 h-2 rounded-full bg-amber-500" /> : <CheckCircle2 size={17} className="text-emerald-600 dark:text-emerald-400" />}
                <div>
                    <p className={`text-sm font-semibold ${dirty ? 'text-amber-900 dark:text-amber-300' : 'text-emerald-900 dark:text-emerald-300'}`}>
                        {dirty ? 'Unpublished changes' : 'Up to date'}
                    </p>
                    <p className={`text-xs ${dirty ? 'text-amber-700 dark:text-amber-400/80' : 'text-emerald-700 dark:text-emerald-400/80'}`}>
                        {dirty ? 'Your live quote form is unchanged until you publish.' : 'Your live quote form matches this draft.'}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={onPreview}><Eye size={14} /> Preview</Button>
                {dirty && (
                    <Button size="sm" onClick={onPublish} disabled={publishing}>
                        {publishing ? <Loader2 size={13} className="animate-spin" /> : <Send size={14} />} Publish changes
                    </Button>
                )}
            </div>
        </div>
    )
}

function Menu({ children }: { children: ReactNode }) {
    const [open, setOpen] = useState(false)
    return (
        <div className="relative">
            <button type="button" onClick={() => setOpen(v => !v)} aria-label="More actions" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground transition-colors">
                <MoreHorizontal size={17} />
            </button>
            {open && <div className="absolute right-0 top-9 z-20 w-44 rounded-xl border border-border bg-card p-1.5 shadow-xl" onClick={() => setOpen(false)}>{children}</div>}
        </div>
    )
}

function MenuItem({ icon, children, danger, onClick }: { icon: ReactNode; children: ReactNode; danger?: boolean; onClick: () => void }) {
    return (
        <button type="button" onClick={onClick} className={`w-full flex items-center gap-2 px-2.5 py-2 text-sm rounded-lg transition-colors ${danger ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10' : 'text-foreground hover:bg-muted'}`}>
            {icon}{children}
        </button>
    )
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
    return (
        <button type="button" onClick={onChange} className="flex items-center gap-1.5 px-1.5 py-1 rounded-lg hover:bg-muted transition-colors">
            <span className={`relative w-8 h-5 rounded-full transition-colors ${on ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${on ? 'left-3.5' : 'left-0.5'}`} />
            </span>
            <span className={`text-xs ${on ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
        </button>
    )
}

const serviceIcons: Record<string, ReactNode> = {
    home: <Home size={18} />,
    sparkles: <Sparkles size={18} />,
    shield: <ShieldCheck size={18} />,
    team: <UsersRound size={18} />,
}

function ServiceTypeCard({
    service, onOpen, onEdit, onDuplicate, onToggle, onDelete, onDrop,
}: {
    service: QuoteWorkflowServiceType; onOpen: () => void; onEdit: () => void; onDuplicate: () => void
    onToggle: () => void; onDelete: () => void; onDrop: (from: number, to: number) => void
}) {
    const [dragOver, setDragOver] = useState(false)
    const activeSteps = service.steps.filter(step => step.active).length
    return (
        <Card className={`group p-4 transition-all ${!service.active ? 'bg-muted/50 opacity-70' : ''} ${dragOver ? 'ring-2 ring-primary/20 border-primary/40' : ''}`}>
            <div
                className="flex items-center gap-3"
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { setDragOver(false); onDrop(Number(e.dataTransfer.getData('index')), service.order) }}
            >
                <span draggable onDragStart={e => e.dataTransfer.setData('index', String(service.order))} className="text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing">
                    <GripVertical size={18} />
                </span>
                <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    {serviceIcons[service.icon] ?? serviceIcons.home}
                </span>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground truncate">{service.label}</p>
                        {!service.active && <Badge>Inactive</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{service.description}</p>
                    <p className="text-xs text-muted-foreground/70 mt-1.5">
                        {activeSteps} {activeSteps === 1 ? 'question' : 'questions'} · {service.requiresManualQuote ? 'manual quote' : `from £${service.basePrice}`}
                    </p>
                </div>
                <Toggle on={service.active} onChange={onToggle} label={service.active ? 'Active' : 'Inactive'} />
                <Button variant="outline" size="sm" onClick={onOpen}>Edit steps</Button>
                <Menu>
                    <MenuItem icon={<Pencil size={14} />} onClick={onEdit}>Edit details</MenuItem>
                    <MenuItem icon={<Copy size={14} />} onClick={onDuplicate}>Duplicate</MenuItem>
                    <MenuItem icon={service.active ? <Eye size={14} /> : <Check size={14} />} onClick={onToggle}>{service.active ? 'Deactivate' : 'Activate'}</MenuItem>
                    <MenuItem icon={<Trash2 size={14} />} danger onClick={onDelete}>Delete</MenuItem>
                </Menu>
            </div>
        </Card>
    )
}

const blankService = (): QuoteWorkflowServiceType => ({
    key: '', label: '', description: '', icon: 'home', order: 0, active: true, basePrice: 0, requiresManualQuote: false, questionsPerPage: 1,
    steps: [{
        id: uid(), type: 'contact', label: 'Your contact details', subtitle: 'Where should we send your estimate?',
        placeholder: '', helpText: '', required: true, order: 0, active: true,
    }],
})

function ServiceTypeModal({ initial, onClose, onSave }: { initial?: QuoteWorkflowServiceType; onClose: () => void; onSave: (service: QuoteWorkflowServiceType) => void }) {
    const [value, setValue] = useState<QuoteWorkflowServiceType>(initial ? structuredClone(initial) : blankService())
    const [keyEdited, setKeyEdited] = useState(Boolean(initial))
    const valid = value.label.trim() && value.key.trim()
    const updateLabel = (label: string) => {
        setValue(v => ({ ...v, label, key: keyEdited ? v.key : slugify(label) }))
    }
    return (
        <Modal onClose={onClose}>
            <ModalHeader title={initial ? 'Edit service type' : 'Add service type'} description="Set how this service appears at the start of your quote form." onClose={onClose} />
            <div className="p-6 flex flex-col gap-4">
                <Input label="Label" value={value.label} onChange={e => updateLabel(e.target.value)} placeholder="e.g. Home Cleaning" autoFocus />
                <Input label="Key (URL-safe)" value={value.key} onChange={e => { setKeyEdited(true); setValue(v => ({ ...v, key: slugify(e.target.value) })) }} placeholder="home-cleaning" />
                <Input label="Description" value={value.description} onChange={e => setValue(v => ({ ...v, description: e.target.value }))} placeholder="A short description for visitors" />
                <div>
                    <p className="text-sm font-medium text-foreground mb-2">Icon</p>
                    <div className="flex gap-2">
                        {[
                            { id: 'home', icon: <Home size={17} /> },
                            { id: 'sparkles', icon: <Sparkles size={17} /> },
                            { id: 'shield', icon: <ShieldCheck size={17} /> },
                            { id: 'team', icon: <UsersRound size={17} /> },
                        ].map(item => (
                            <Button key={item.id} type="button" variant={value.icon === item.id ? 'default' : 'outline'} onClick={() => setValue(v => ({ ...v, icon: item.id }))} className="!px-3" aria-label={`${item.id} icon`}>
                                {item.icon}
                            </Button>
                        ))}
                    </div>
                </div>
                <Input label="Base price" type="number" min="0" icon={<span className="text-sm">£</span>} value={value.basePrice} onChange={e => setValue(v => ({ ...v, basePrice: Number(e.target.value) }))} />
                <div>
                    <p className="text-sm font-medium text-foreground mb-2">Questions per page</p>
                    <p className="text-xs text-muted-foreground mb-2">How many questions visitors see on one screen before continuing. Your contact details are always their own final page.</p>
                    <div className="flex gap-2">
                        {[1, 2, 3, 4].map(n => (
                            <Button key={n} type="button" variant={value.questionsPerPage === n ? 'default' : 'outline'} onClick={() => setValue(v => ({ ...v, questionsPerPage: n }))} className="!px-4">{n}</Button>
                        ))}
                    </div>
                </div>
                <div>
                    <p className="text-sm font-medium text-foreground mb-2">Instant pricing</p>
                    <div className="rounded-xl border border-border divide-y divide-border">
                        {[
                            { manual: false, title: 'Show an instant estimate', sub: 'Visitors see the estimated total as they answer.' },
                            { manual: true, title: 'Review and get back to them', sub: 'Best for enquiry-only services and custom contracts.' },
                        ].map(option => (
                            <label key={String(option.manual)} className="flex gap-3 p-3.5 cursor-pointer hover:bg-muted">
                                <input type="radio" checked={value.requiresManualQuote === option.manual} onChange={() => setValue(v => ({ ...v, requiresManualQuote: option.manual }))} className="accent-primary mt-0.5" />
                                <span><span className="block text-sm font-medium text-foreground">{option.title}</span><span className="block text-xs text-muted-foreground mt-0.5">{option.sub}</span></span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>
            <div className="px-6 py-4 border-t border-border flex justify-end gap-2">
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button disabled={!valid} onClick={() => onSave(value)}>Save service type</Button>
            </div>
        </Modal>
    )
}

function StepRow({
    step, onEdit, onDuplicate, onToggle, onDelete, onDrop,
}: {
    step: QuoteWorkflowStep; onEdit: () => void; onDuplicate: () => void; onToggle: () => void; onDelete: () => void
    onDrop: (from: number, to: number) => void
}) {
    const [dragOver, setDragOver] = useState(false)
    const hint = step.type === 'number' && step.numberConfig?.pricePerUnit
        ? `+£${step.numberConfig.pricePerUnit}/unit`
        : (step.type === 'choice' || step.type === 'multiselect') ? `${step.options?.length ?? 0} options` : typeLabels[step.type]
    return (
        <Card className={`${!step.active ? 'bg-muted/50 opacity-70' : ''} ${dragOver ? 'ring-2 ring-primary/20' : ''}`}>
            <div
                className="flex items-center gap-3 px-4 py-3.5"
                onDragOver={e => { if (step.type !== 'contact') { e.preventDefault(); setDragOver(true) } }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { setDragOver(false); onDrop(Number(e.dataTransfer.getData('step-order')), step.order) }}
            >
                {step.type === 'contact'
                    ? <span className="w-[18px] flex justify-center text-muted-foreground/40"><ShieldCheck size={15} /></span>
                    : <span draggable onDragStart={e => e.dataTransfer.setData('step-order', String(step.order))} className="text-muted-foreground/40 hover:text-muted-foreground cursor-grab"><GripVertical size={18} /></span>}
                <StepTypeIcon type={step.type} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground truncate">{step.label}</p>
                        {!step.active && <Badge>Inactive</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{hint}{step.type === 'contact' && ' · Pinned last'}</p>
                </div>
                {step.required ? <Badge variant="primary">Required</Badge> : <Badge>Optional</Badge>}
                <Menu>
                    <MenuItem icon={<Pencil size={14} />} onClick={onEdit}>Edit</MenuItem>
                    {step.type !== 'contact' && <MenuItem icon={<Copy size={14} />} onClick={onDuplicate}>Duplicate</MenuItem>}
                    {step.type !== 'contact' && <MenuItem icon={step.active ? <Eye size={14} /> : <Check size={14} />} onClick={onToggle}>{step.active ? 'Deactivate' : 'Activate'}</MenuItem>}
                    {step.type !== 'contact' && <MenuItem icon={<Trash2 size={14} />} danger onClick={onDelete}>Delete</MenuItem>}
                </Menu>
            </div>
        </Card>
    )
}

const blankStep = (): QuoteWorkflowStep => ({
    id: uid(), type: 'choice', label: '', subtitle: '', placeholder: '', helpText: '',
    required: true, order: 0, active: true,
    options: [
        { label: 'Option 1', value: 'option-1', priceDelta: 0, order: 0 },
        { label: 'Option 2', value: 'option-2', priceDelta: 0, order: 1 },
    ],
})

function LivePreviewPane({ step, companyName }: { step: QuoteWorkflowStep; companyName: string }) {
    const label = step.label || 'Your question will appear here'
    return (
        <div className="bg-muted/40 border-l border-border p-6 lg:min-h-[600px]">
            <div className="flex items-center justify-between mb-5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Live preview</p>
                <Badge variant="success" dot>Updates live</Badge>
            </div>
            <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
                <div className="flex items-center gap-2 mb-6">
                    <span className="w-7 h-7 bg-primary rounded-lg text-primary-foreground flex items-center justify-center"><ClipboardList size={14} /></span>
                    <span className="font-semibold text-foreground">{companyName}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted mb-7"><div className="h-full w-2/5 rounded-full bg-primary" /></div>
                <p className="text-lg font-semibold text-foreground">{label}{step.required && <span className="text-red-500 ml-1">*</span>}</p>
                {step.subtitle && <p className="text-sm text-muted-foreground mt-1.5">{step.subtitle}</p>}
                <div className="mt-5">
                    {step.type === 'choice' && <div className="grid gap-2">{(step.options ?? []).map((o, i) => <div key={i} className="p-3 rounded-xl border border-border flex items-center gap-2.5 text-sm text-foreground"><span className="w-4 h-4 rounded-full border border-border" />{o.label || `Option ${i + 1}`}{o.priceDelta > 0 && <span className="ml-auto text-xs text-muted-foreground">+£{o.priceDelta}</span>}</div>)}</div>}
                    {step.type === 'multiselect' && <div className="grid gap-2">{(step.options ?? []).map((o, i) => <div key={i} className="p-3 rounded-xl border border-border flex items-center gap-2.5 text-sm text-foreground"><span className="w-4 h-4 rounded border border-border" />{o.label || `Option ${i + 1}`}{o.priceDelta > 0 && <span className="ml-auto text-xs text-muted-foreground">+£{o.priceDelta}</span>}</div>)}</div>}
                    {step.type === 'number' && <div className="flex items-center justify-between rounded-xl border border-border p-2"><Button type="button" variant="secondary" className="!px-3">−</Button><span className="font-semibold">{step.numberConfig?.min ?? 1}</span><Button type="button" variant="secondary" className="!px-3">+</Button></div>}
                    {step.type === 'text' && <Input placeholder={step.placeholder || 'Type your answer'} />}
                    {step.type === 'textarea' && <Textarea placeholder={step.placeholder || 'Type your answer'} rows={4} />}
                    {step.type === 'date' && <Input type="date" />}
                    {step.type === 'contact' && <div className="grid gap-3"><Input label="Full name" placeholder="Your name" /><Input label="Email address" placeholder="you@example.com" /><Input label="Phone number" placeholder="+44" /></div>}
                </div>
                {step.helpText && <p className="text-xs text-muted-foreground mt-2 flex gap-1.5"><HelpCircle size={13} />{step.helpText}</p>}
                <Button className="w-full mt-6">Continue</Button>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-3">This uses the same components as your public quote form.</p>
        </div>
    )
}

function StepEditorModal({ initial, onClose, onSave }: { initial?: QuoteWorkflowStep; onClose: () => void; onSave: (step: QuoteWorkflowStep) => void }) {
    const [step, setStep] = useState<QuoteWorkflowStep>(initial ? structuredClone(initial) : blankStep())
    const choice = step.type === 'choice' || step.type === 'multiselect'
    const addOption = () => setStep(s => ({ ...s, options: [...(s.options ?? []), { label: '', value: '', priceDelta: 0, order: s.options?.length ?? 0 }] }))
    const reorderOption = (from: number, to: number) => {
        if (from === to || Number.isNaN(from)) return
        setStep(s => {
            const options = [...(s.options ?? [])]
            const [moved] = options.splice(from, 1)
            options.splice(to, 0, moved)
            return { ...s, options: options.map((option, order) => ({ ...option, order })) }
        })
    }
    return (
        <Modal onClose={onClose} wide>
            <ModalHeader title={initial ? `Edit ${initial.type === 'contact' ? 'contact step' : 'question'}` : 'Add question'} description="Configure the question and check exactly how visitors will see it." onClose={onClose} />
            <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
                <div className="p-6 flex flex-col gap-4">
                    {step.type !== 'contact' && (
                        <Select
                            label="Question type"
                            value={step.type}
                            onChange={v => setStep(s => ({
                                ...s,
                                type: v as QuoteStepType,
                                options: (v === 'choice' || v === 'multiselect') && !s.options?.length ? blankStep().options : s.options,
                                numberConfig: v === 'number' ? (s.numberConfig ?? { min: 1, max: 10, step: 1 }) : s.numberConfig,
                            }))}
                            options={[
                                { value: 'choice', label: 'Single choice — pick one option' },
                                { value: 'multiselect', label: 'Multiple choice — pick any options' },
                                { value: 'number', label: 'Number — choose an amount' },
                                { value: 'text', label: 'Short text — one line answer' },
                                { value: 'textarea', label: 'Long text — detailed answer' },
                                { value: 'date', label: 'Date — choose a day' },
                            ]}
                        />
                    )}
                    <Input label="Label" value={step.label} onChange={e => setStep(s => ({ ...s, label: e.target.value }))} placeholder="Ask a clear, short question" autoFocus />
                    <Input label="Subtitle (optional)" value={step.subtitle} onChange={e => setStep(s => ({ ...s, subtitle: e.target.value }))} placeholder="Helpful context shown below the question" />
                    {step.type !== 'contact' && (
                        <div>
                            <p className="text-sm font-medium text-foreground mb-2">Required</p>
                            <div className="flex gap-2">
                                <Button type="button" variant={step.required ? 'default' : 'outline'} onClick={() => setStep(s => ({ ...s, required: true }))}>Yes</Button>
                                <Button type="button" variant={!step.required ? 'default' : 'outline'} onClick={() => setStep(s => ({ ...s, required: false }))}>No</Button>
                            </div>
                        </div>
                    )}
                    {choice && (
                        <div className="pt-4 border-t border-border">
                            <div className="flex items-center justify-between mb-3">
                                <div><p className="text-sm font-semibold text-foreground">Options</p><p className="text-xs text-muted-foreground mt-0.5">Add a flat price adjustment only when needed.</p></div>
                                <span className="text-xs text-muted-foreground">Price adjustment</span>
                            </div>
                            <div className="flex flex-col gap-2">
                                {(step.options ?? []).map((option, index) => (
                                    <div key={index} className="flex items-center gap-2" onDragOver={e => e.preventDefault()} onDrop={e => reorderOption(Number(e.dataTransfer.getData('option-order')), index)}>
                                        <span draggable onDragStart={e => e.dataTransfer.setData('option-order', String(index))} className="text-muted-foreground/40 shrink-0 cursor-grab"><GripVertical size={16} /></span>
                                        <Input value={option.label} onChange={e => setStep(s => ({ ...s, options: (s.options ?? []).map((o, i) => i === index ? { ...o, label: e.target.value, value: slugify(e.target.value) } : o) }))} className="!h-9" />
                                        <div className="w-24 shrink-0"><Input type="number" icon={<span>£</span>} value={option.priceDelta} onChange={e => setStep(s => ({ ...s, options: (s.options ?? []).map((o, i) => i === index ? { ...o, priceDelta: Number(e.target.value) } : o) }))} /></div>
                                        <button type="button" onClick={() => setStep(s => ({ ...s, options: (s.options ?? []).filter((_, i) => i !== index) }))} aria-label="Delete option" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground transition-colors shrink-0"><X size={15} /></button>
                                    </div>
                                ))}
                            </div>
                            <Button type="button" variant="outline" size="sm" className="mt-3" onClick={addOption}><Plus size={14} /> Add option</Button>
                        </div>
                    )}
                    {step.type === 'number' && (
                        <div className="pt-4 border-t border-border">
                            <p className="text-sm font-semibold text-foreground mb-3">Number settings</p>
                            <div className="grid grid-cols-3 gap-3">
                                {(['min', 'max', 'step'] as const).map(key => (
                                    <Input key={key} label={{ min: 'Minimum', max: 'Maximum', step: 'Step' }[key]} type="number" value={step.numberConfig?.[key] ?? 1} onChange={e => setStep(s => ({ ...s, numberConfig: { ...(s.numberConfig ?? { min: 1, max: 10, step: 1 }), [key]: Number(e.target.value) } }))} />
                                ))}
                            </div>
                            <div className="mt-3"><Input label="Price per unit (optional)" type="number" icon={<span>£</span>} value={step.numberConfig?.pricePerUnit ?? ''} placeholder="No pricing impact" onChange={e => setStep(s => ({ ...s, numberConfig: { ...(s.numberConfig ?? { min: 1, max: 10, step: 1 }), pricePerUnit: e.target.value ? Number(e.target.value) : undefined } }))} /></div>
                        </div>
                    )}
                    {(step.type === 'text' || step.type === 'textarea') && (
                        <div className="pt-4 border-t border-border flex flex-col gap-3">
                            <Input label="Placeholder" value={step.placeholder} onChange={e => setStep(s => ({ ...s, placeholder: e.target.value }))} placeholder="Example answer shown in the field" />
                            <Input label="Help text" value={step.helpText} onChange={e => setStep(s => ({ ...s, helpText: e.target.value }))} placeholder="Optional text shown under the field" />
                        </div>
                    )}
                </div>
                <LivePreviewPane step={step} companyName="Your Company" />
            </div>
            <div className="px-6 py-4 border-t border-border flex justify-end gap-2">
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button disabled={!step.label.trim() || (choice && !(step.options ?? []).length)} onClick={() => onSave(step)}>Save step</Button>
            </div>
        </Modal>
    )
}

function ConfirmDeleteDialog({ title, name, detail, onClose, onConfirm }: { title: string; name: string; detail: string; onClose: () => void; onConfirm: () => void }) {
    const [typed, setTyped] = useState('')
    return (
        <Modal onClose={onClose}>
            <ModalHeader title={title} description={detail} onClose={onClose} />
            <div className="p-6">
                <div className="rounded-xl bg-red-50 border border-red-100 dark:bg-red-500/10 dark:border-red-500/30 p-3.5 text-sm text-red-700 dark:text-red-400">This action cannot be undone. Deactivate it instead if you may need it later.</div>
                <div className="mt-4">
                    <p className="text-sm font-medium text-foreground mb-1.5">Type <strong>{name}</strong> to confirm</p>
                    <Input value={typed} onChange={e => setTyped(e.target.value)} />
                </div>
            </div>
            <div className="px-6 py-4 border-t border-border flex justify-end gap-2">
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button variant="destructive" disabled={typed !== name} onClick={onConfirm}>Delete permanently</Button>
            </div>
        </Modal>
    )
}

function PublishConfirmModal({ services, publishing, onClose, onPublish }: { services: QuoteWorkflowServiceType[]; publishing: boolean; onClose: () => void; onPublish: () => void }) {
    return (
        <Modal onClose={onClose}>
            <ModalHeader title="Publish changes?" description="This updates your live quote form immediately." onClose={onClose} />
            <div className="p-6">
                <p className="text-sm text-muted-foreground">Anyone opening your quote link after this will see the new questions and pricing.</p>
                <div className="mt-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Service types in this draft</p>
                    <div className="rounded-xl bg-muted/50 border border-border divide-y divide-border">
                        {services.map(service => (
                            <div key={service.key} className="flex gap-2.5 p-3 text-sm text-muted-foreground">
                                <Check size={14} className="text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                                <span><strong className="text-foreground">{service.label}</strong> — questions, order or pricing updated</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="px-6 py-4 border-t border-border flex justify-end gap-2">
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button disabled={publishing} onClick={onPublish}>{publishing ? <Loader2 size={13} className="animate-spin" /> : 'Publish now'}</Button>
            </div>
        </Modal>
    )
}

function LiveQuestion({ step }: { step: QuoteWorkflowStep }) {
    return (
        <div>
            <p className="text-2xl font-semibold text-foreground">{step.label}{step.required && <span className="text-red-500 ml-1">*</span>}</p>
            {step.subtitle && <p className="text-sm text-muted-foreground mt-2">{step.subtitle}</p>}
            <div className="mt-7">
                {(step.type === 'choice' || step.type === 'multiselect') && <div className="grid gap-2.5">{(step.options ?? []).map(o => <Button key={o.value} type="button" variant="outline" className="!h-auto !p-4 !justify-start"><span className={step.type === 'choice' ? 'w-4 h-4 rounded-full border border-border' : 'w-4 h-4 rounded border border-border'} />{o.label}{o.priceDelta > 0 && <span className="ml-auto text-muted-foreground">+£{o.priceDelta}</span>}</Button>)}</div>}
                {step.type === 'number' && <div className="flex items-center justify-between border border-border rounded-xl p-3"><Button type="button" variant="secondary">−</Button><span className="text-xl font-semibold">{step.numberConfig?.min ?? 1}</span><Button type="button" variant="secondary">+</Button></div>}
                {step.type === 'text' && <Input placeholder={step.placeholder} />}
                {step.type === 'textarea' && <Textarea placeholder={step.placeholder} rows={5} />}
                {step.type === 'date' && <Input type="date" />}
                {step.type === 'contact' && <div className="grid gap-4"><Input label="Full name" /><Input label="Email address" type="email" /><Input label="Phone number" type="tel" /></div>}
            </div>
            {step.helpText && <p className="text-xs text-muted-foreground mt-2">{step.helpText}</p>}
        </div>
    )
}

// Mirrors how the public wizard pages questions (see quote.xeniapure.com's
// configs/dynamic.tsx) — groups consecutive active, non-contact steps into
// pages of `size`; the contact step is always its own final page.
function chunkSteps(steps: QuoteWorkflowStep[], size: number): QuoteWorkflowStep[][] {
    const n = Math.max(1, size || 1)
    const nonContact = steps.filter(s => s.type !== 'contact')
    const contact = steps.filter(s => s.type === 'contact')
    const pages: QuoteWorkflowStep[][] = []
    for (let i = 0; i < nonContact.length; i += n) pages.push(nonContact.slice(i, i + n))
    for (const c of contact) pages.push([c])
    return pages
}

function PreviewMode({ services, companyName, onExit }: { services: QuoteWorkflowServiceType[]; companyName: string; onExit: () => void }) {
    const activeServices = services.filter(s => s.active)
    const [serviceKey, setServiceKey] = useState(activeServices[0]?.key ?? '')
    const service = activeServices.find(s => s.key === serviceKey)
    const [pageIndex, setPageIndex] = useState(-1)
    const sortedSteps = useMemo(() => [...(service?.steps ?? [])].filter(s => s.active).sort((a, b) => a.order - b.order), [service])
    const pages = useMemo(() => chunkSteps(sortedSteps, service?.questionsPerPage ?? 1), [sortedSteps, service])
    const currentPage = pages[pageIndex]
    return (
        <div className="fixed inset-0 z-50 bg-muted/60 overflow-y-auto">
            <div className="sticky top-0 z-10 bg-amber-50 dark:bg-amber-500/10 border-b border-amber-200 dark:border-amber-500/30 px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Badge variant="warning">Preview</Badge>
                    <div><p className="text-sm font-semibold text-amber-900 dark:text-amber-300">This is your draft, not what's live</p><p className="text-xs text-amber-700 dark:text-amber-400/80">Submitting here won't create a real lead.</p></div>
                </div>
                <Button variant="outline" onClick={onExit}><X size={15} /> Exit preview</Button>
            </div>
            <div className="max-w-2xl mx-auto py-12 px-6">
                <Card className="shadow-sm overflow-hidden">
                    <div className="px-8 py-6 border-b border-border flex items-center justify-between">
                        <div className="flex items-center gap-2.5"><span className="w-9 h-9 bg-primary text-primary-foreground rounded-xl flex items-center justify-center"><ClipboardList size={17} /></span><div><p className="font-semibold text-foreground">{companyName}</p><p className="text-xs text-muted-foreground">Request a quote</p></div></div>
                        {pageIndex >= 0 && <span className="text-xs font-medium text-muted-foreground">{pageIndex + 1} of {pages.length}</span>}
                    </div>
                    <div className="p-8 min-h-[430px]">
                        {pageIndex < 0 ? (
                            <>
                                <p className="text-2xl font-semibold text-foreground">What can we help with?</p>
                                <p className="text-sm text-muted-foreground mt-2">Choose a service to get a quick estimate.</p>
                                <div className="grid grid-cols-2 gap-3 mt-7">
                                    {activeServices.map(item => <Button key={item.key} type="button" variant={serviceKey === item.key ? 'default' : 'outline'} className="!h-auto !p-4 !justify-start" onClick={() => setServiceKey(item.key)}><Home size={18} /><span className="text-left"><span className="block">{item.label}</span><span className="block text-xs font-normal mt-0.5 opacity-70">{item.description}</span></span></Button>)}
                                </div>
                            </>
                        ) : currentPage ? (
                            <div className="flex flex-col gap-8">
                                {currentPage.map(step => <LiveQuestion key={step.id} step={step} />)}
                            </div>
                        ) : <div className="text-center py-16"><CheckCircle2 size={42} className="text-emerald-500 mx-auto" /><p className="text-xl font-semibold mt-4">Preview complete</p><p className="text-sm text-muted-foreground mt-1">No lead was created.</p></div>}
                    </div>
                    <div className="px-8 py-5 border-t border-border flex justify-between">
                        <Button variant="ghost" disabled={pageIndex < 0} onClick={() => setPageIndex(i => i - 1)}><ArrowLeft size={15} /> Back</Button>
                        <Button disabled={!service} onClick={() => setPageIndex(i => i + 1)}>{pageIndex < 0 ? 'Start quote' : currentPage?.some(s => s.type === 'contact') ? 'Submit preview' : 'Continue'}</Button>
                    </div>
                </Card>
            </div>
        </div>
    )
}

export default function QuoteWorkflowSettings() {
    const { user } = useOutletContext<{ user: iUser }>()
    const isAdmin = isAdminRole(user?.role)
    const queryClient = useQueryClient()

    const { data, isLoading } = useQuery({ queryKey: ['quote-workflow'], queryFn: getQuoteWorkflow, enabled: isAdmin })
    const { data: link } = useQuery({ queryKey: ['public-quote-link'], queryFn: getPublicQuoteLink, enabled: isAdmin })

    const [serviceTypes, setServiceTypes] = useState<QuoteWorkflowServiceType[] | null>(null)
    const initializedRef = useRef(false)
    useEffect(() => {
        if (data && !initializedRef.current) {
            setServiceTypes(data.draft.serviceTypes)
            initializedRef.current = true
        }
    }, [data])

    const saveDraftMutation = useMutation({
        mutationFn: saveQuoteWorkflowDraft,
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not save your changes.'),
    })
    const skipNextSaveRef = useRef(true)
    useEffect(() => {
        if (!serviceTypes) return
        if (skipNextSaveRef.current) { skipNextSaveRef.current = false; return }
        saveDraftMutation.mutate({ serviceTypes })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [serviceTypes])

    const publishMutation = useMutation({
        mutationFn: publishQuoteWorkflow,
        onSuccess: (result) => {
            queryClient.setQueryData(['quote-workflow'], (old: typeof data) => old && { ...old, published: result.published, publishedAt: result.publishedAt })
            toast.success('Quote workflow published')
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not publish.'),
    })

    const [selectedKey, setSelectedKey] = useState<string | null>(null)
    const [serviceModal, setServiceModal] = useState<{ service?: QuoteWorkflowServiceType } | null>(null)
    const [stepModal, setStepModal] = useState<{ step?: QuoteWorkflowStep } | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<{ type: 'service' | 'step'; name: string; id: string } | null>(null)
    const [preview, setPreview] = useState(false)
    const [publishOpen, setPublishOpen] = useState(false)

    const selected = serviceTypes?.find(s => s.key === selectedKey)
    const sortedServices = useMemo(() => serviceTypes ? [...serviceTypes].sort((a, b) => a.order - b.order) : [], [serviceTypes])
    const dirty = useMemo(() => JSON.stringify(serviceTypes) !== JSON.stringify(data?.published?.serviceTypes ?? null), [serviceTypes, data])

    const change = (fn: (current: QuoteWorkflowServiceType[]) => QuoteWorkflowServiceType[]) => {
        setServiceTypes(current => (current ? fn(current) : current))
    }
    const updateSelected = (fn: (service: QuoteWorkflowServiceType) => QuoteWorkflowServiceType) => change(current => current.map(service => service.key === selectedKey ? fn(service) : service))

    const reorder = (from: number, to: number) => {
        if (from === to || Number.isNaN(from)) return
        change(current => {
            const sorted = [...current].sort((a, b) => a.order - b.order)
            const [moved] = sorted.splice(from, 1)
            sorted.splice(to, 0, moved)
            return sorted.map((s, order) => ({ ...s, order }))
        })
    }
    const reorderSteps = (from: number, to: number) => {
        if (!selected || from === to || Number.isNaN(from)) return
        updateSelected(service => {
            const contact = service.steps.find(s => s.type === 'contact')
            const movable = service.steps.filter(s => s.type !== 'contact').sort((a, b) => a.order - b.order)
            const [moved] = movable.splice(from, 1)
            movable.splice(Math.min(to, movable.length), 0, moved)
            const next = movable.map((s, order) => ({ ...s, order }))
            if (contact) next.push({ ...contact, order: next.length })
            return { ...service, steps: next }
        })
    }
    const saveService = (value: QuoteWorkflowServiceType) => {
        const originalKey = serviceModal?.service?.key
        change(current => originalKey ? current.map(s => s.key === originalKey ? value : s) : [...current, { ...value, order: current.length }])
        setServiceModal(null)
    }
    const saveStep = (value: QuoteWorkflowStep) => {
        updateSelected(service => {
            const exists = service.steps.some(s => s.id === value.id)
            const steps = exists
                ? service.steps.map(s => s.id === value.id ? value : s)
                : [...service.steps.filter(s => s.type !== 'contact'), { ...value, order: service.steps.length - 1 }, ...service.steps.filter(s => s.type === 'contact')]
            return { ...service, steps: steps.map((s, order) => ({ ...s, order })) }
        })
        setStepModal(null)
    }
    const confirmDelete = () => {
        if (!deleteTarget) return
        if (deleteTarget.type === 'service') {
            change(current => current.filter(s => s.key !== deleteTarget.id).map((s, order) => ({ ...s, order })))
            if (selectedKey === deleteTarget.id) setSelectedKey(null)
        } else {
            updateSelected(service => ({ ...service, steps: service.steps.filter(s => s.id !== deleteTarget.id).map((s, order) => ({ ...s, order })) }))
        }
        setDeleteTarget(null)
        toast.success('Deleted from draft')
    }

    if (!isAdmin) {
        return (
            <div className="p-6 max-w-3xl mx-auto animate-fade-in">
                <Card className="p-6">
                    <p className="text-sm text-muted-foreground">Only company admins can edit the quote workflow.</p>
                </Card>
            </div>
        )
    }

    if (isLoading || !serviceTypes) {
        return (
            <div className="p-6 max-w-5xl mx-auto animate-fade-in flex justify-center py-16 text-muted-foreground">
                <Loader2 size={20} className="animate-spin" />
            </div>
        )
    }

    const companyName = user?.company?.name || 'Your Company'

    return (
        <div className="p-6 max-w-5xl mx-auto animate-fade-in">
            <div className="mb-5">
                {selected && (
                    <Button variant="ghost" size="sm" className="!-ml-3 mb-2" onClick={() => setSelectedKey(null)}><ArrowLeft size={15} /> All service types</Button>
                )}
                <div className="flex items-start justify-between gap-5">
                    <div>
                        <h1 className="text-xl font-semibold text-foreground tracking-tight">{selected ? `${selected.label} — Steps` : 'Quote Workflow'}</h1>
                        <p className="text-sm text-muted-foreground mt-1 max-w-xl">{selected ? 'Arrange the questions visitors answer for this service.' : "Build the questions your public quote form asks, then publish when you're ready."}</p>
                    </div>
                    {selected && <Button onClick={() => setStepModal({})}><Plus size={15} /> Add step</Button>}
                </div>
            </div>

            <StatusStrip dirty={dirty} onPreview={() => setPreview(true)} onPublish={() => setPublishOpen(true)} publishing={publishMutation.isPending} />

            {!selected ? (
                <div className="mt-5">
                    <div className="flex items-center justify-between mb-3">
                        <div><p className="text-sm font-semibold text-foreground">Service types</p><p className="text-xs text-muted-foreground mt-0.5">Visitors choose one before answering its questions.</p></div>
                        <Button size="sm" onClick={() => setServiceModal({})}><Plus size={14} /> Add service type</Button>
                    </div>
                    {sortedServices.length ? (
                        <div className="flex flex-col gap-3">
                            {sortedServices.map(service => (
                                <ServiceTypeCard
                                    key={service.key} service={service} onOpen={() => setSelectedKey(service.key)}
                                    onEdit={() => setServiceModal({ service })}
                                    onDuplicate={() => change(current => [...current, { ...structuredClone(service), key: `${service.key}-copy-${uid()}`, label: `${service.label} copy`, order: current.length }])}
                                    onToggle={() => change(current => current.map(s => s.key === service.key ? { ...s, active: !s.active } : s))}
                                    onDelete={() => setDeleteTarget({ type: 'service', name: service.label, id: service.key })}
                                    onDrop={reorder}
                                />
                            ))}
                        </div>
                    ) : (
                        <Card className="py-14 text-center">
                            <span className="w-12 h-12 rounded-xl bg-muted text-muted-foreground flex items-center justify-center mx-auto"><ClipboardList size={21} /></span>
                            <p className="text-sm font-semibold text-foreground mt-4">No service types yet</p>
                            <p className="text-xs text-muted-foreground mt-1">Add your first service to start building its quote questions.</p>
                            <Button className="mt-4" onClick={() => setServiceModal({})}><Plus size={14} /> Add your first service type</Button>
                        </Card>
                    )}
                    <div className="mt-5 rounded-xl border border-blue-100 dark:border-blue-500/30 bg-blue-50/60 dark:bg-blue-500/10 p-4 flex gap-3">
                        <HelpCircle size={17} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-300">Your public quote link</p>
                            <p className="text-xs text-blue-700 dark:text-blue-400/80 mt-0.5">
                                {link?.url ? <>{link.url} · The link always shows your last published version.</> : (
                                    <>No quote link yet — <Link to="/settings/quote-link" className="underline">create one in Quote Link settings</Link>.</>
                                )}
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="mt-5">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-medium text-muted-foreground">{selected.steps.length} steps · Drag to reorder</p>
                        <div className="flex items-center gap-2">
                            <Badge variant={selected.active ? 'success' : 'neutral'} dot={selected.active}>{selected.active ? 'Service active' : 'Service inactive'}</Badge>
                            <Button variant="outline" size="sm" onClick={() => setServiceModal({ service: selected })}><Pencil size={13} /> Edit details</Button>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2.5">
                        {[...selected.steps].sort((a, b) => a.order - b.order).map(step => (
                            <StepRow key={step.id} step={step} onEdit={() => setStepModal({ step })}
                                onDuplicate={() => updateSelected(service => {
                                    const contact = service.steps.find(s => s.type === 'contact')
                                    const others = service.steps.filter(s => s.type !== 'contact')
                                    const copy = { ...structuredClone(step), id: uid(), label: `${step.label} copy` }
                                    const next = [...others, copy].map((s, order) => ({ ...s, order }))
                                    return { ...service, steps: contact ? [...next, { ...contact, order: next.length }] : next }
                                })}
                                onToggle={() => updateSelected(service => ({ ...service, steps: service.steps.map(s => s.id === step.id ? { ...s, active: !s.active } : s) }))}
                                onDelete={() => setDeleteTarget({ type: 'step', name: step.label, id: step.id })}
                                onDrop={reorderSteps}
                            />
                        ))}
                    </div>
                    <Button variant="outline" className="w-full mt-3 border-dashed" onClick={() => setStepModal({})}><Plus size={15} /> Add another question</Button>
                </div>
            )}

            {serviceModal && <ServiceTypeModal initial={serviceModal.service} onClose={() => setServiceModal(null)} onSave={saveService} />}
            {stepModal && <StepEditorModal initial={stepModal.step} onClose={() => setStepModal(null)} onSave={saveStep} />}
            {deleteTarget && <ConfirmDeleteDialog title={`Delete ${deleteTarget.type === 'service' ? 'service type' : 'question'}?`} name={deleteTarget.name} detail={`"${deleteTarget.name}" will be removed from this draft.`} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} />}
            {publishOpen && (
                <PublishConfirmModal
                    services={serviceTypes}
                    publishing={publishMutation.isPending}
                    onClose={() => setPublishOpen(false)}
                    onPublish={() => publishMutation.mutate(undefined, { onSuccess: () => setPublishOpen(false) })}
                />
            )}
            {preview && <PreviewMode services={serviceTypes} companyName={companyName} onExit={() => setPreview(false)} />}
        </div>
    )
}
