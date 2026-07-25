import { useState } from 'react'
import { ChevronLeft, MapPin, Users, Clock, Calendar, Paperclip, ChevronDown, X, Check } from 'lucide-react'
import { Button, Input, Textarea, Select, Avatar } from '../components/ui'
import { workers } from '../data/mockData'
import { useNavigate } from 'react-router'

export function CreateJob() {
  const [form, setForm] = useState({
    name: '',
    description: '',
    company: '',
    location: '',
    date: '',
    startTime: '',
    endTime: '',
    priority: 'medium',
    notes: '',
  })
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([])
  const [workerOpen, setWorkerOpen] = useState(false)
  const [saved, setSaved] = useState(false)
  const navigate = useNavigate()
  const onNavigate = (path: string) => navigate(path)
  const toggleWorker = (id: string) => {
    setSelectedWorkers(prev => prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id])
  }

  const handleSave = (_publish: boolean) => {
    setSaved(true)
    setTimeout(() => onNavigate('jobs'), 800)
  }

  if (saved) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="text-center animate-fade-in">
          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <Check size={24} className="text-emerald-600" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">Job Created</h2>
          <p className="text-sm text-slate-500 mt-1">Redirecting to Jobs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-7">
        <button onClick={() => onNavigate('jobs')} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors">
          <ChevronLeft size={16} />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Create New Job</h1>
          <p className="text-sm text-slate-500 mt-0.5">Fill in the details to assign work to your team</p>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        {/* Basic Info */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
          <h2 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#1E3A5F] text-white flex items-center justify-center text-[10px] font-bold">1</span>
            Job Details
          </h2>
          <div className="grid grid-cols-1 gap-4">
            <Input
              label="Job Name"
              placeholder="e.g. Canary Wharf Security — Night Shift"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
            <Textarea
              label="Description"
              placeholder="Brief description of the work required..."
              value={form.description}
              onChange={v => setForm(f => ({ ...f, description: v }))}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Company / Client"
                placeholder="e.g. SecureGuard Ltd"
                value={form.company}
                onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
              />
              <Select
                label="Priority"
                value={form.priority}
                onChange={v => setForm(f => ({ ...f, priority: v }))}
                options={[
                  { value: 'low', label: 'Low Priority' },
                  { value: 'medium', label: 'Medium Priority' },
                  { value: 'high', label: 'High Priority' },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
          <h2 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#1E3A5F] text-white flex items-center justify-center text-[10px] font-bold">2</span>
            Location
          </h2>
          <Input
            label="Site Address"
            placeholder="e.g. Canary Wharf, London E14"
            icon={<MapPin size={14} />}
            value={form.location}
            onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
          />
          {/* Map placeholder */}
          <div className="mt-3 h-36 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
            <div className="text-center">
              <MapPin size={20} className="text-slate-400 mx-auto mb-1" />
              <p className="text-xs text-slate-400">Map preview will appear here</p>
            </div>
          </div>
        </div>

        {/* Date & Time */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
          <h2 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#1E3A5F] text-white flex items-center justify-center text-[10px] font-bold">3</span>
            Date & Time
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Date"
              type="date"
              icon={<Calendar size={14} />}
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            />
            <Input
              label="Start Time"
              type="time"
              icon={<Clock size={14} />}
              value={form.startTime}
              onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
            />
            <Input
              label="End Time"
              type="time"
              icon={<Clock size={14} />}
              value={form.endTime}
              onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
            />
          </div>
          {form.startTime && form.endTime && (
            <div className="mt-3 bg-blue-50 border border-blue-100 rounded-lg px-4 py-2.5 flex items-center gap-2">
              <Clock size={14} className="text-blue-500" />
              <p className="text-sm text-blue-700">
                <span className="font-semibold">
                  {(() => {
                    const [sh, sm] = form.startTime.split(':').map(Number)
                    const [eh, em] = form.endTime.split(':').map(Number)
                    const mins = (eh * 60 + em) - (sh * 60 + sm)
                    const h = Math.floor(Math.abs(mins) / 60)
                    const m = Math.abs(mins) % 60
                    return `${h}h ${m > 0 ? m + 'm' : ''}`
                  })()}
                </span> shift duration
              </p>
            </div>
          )}
        </div>

        {/* Workers */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
          <h2 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#1E3A5F] text-white flex items-center justify-center text-[10px] font-bold">4</span>
            Assign Workers
          </h2>

          <button
            onClick={() => setWorkerOpen(!workerOpen)}
            className="w-full flex items-center justify-between h-9 px-3 border border-[#E2E8F0] rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Users size={14} className="text-slate-400" />
              {selectedWorkers.length > 0 ? `${selectedWorkers.length} worker${selectedWorkers.length > 1 ? 's' : ''} selected` : 'Select workers...'}
            </span>
            <ChevronDown size={14} className={`text-slate-400 transition-transform ${workerOpen ? 'rotate-180' : ''}`} />
          </button>

          {workerOpen && (
            <div className="mt-2 border border-[#E2E8F0] rounded-xl overflow-hidden animate-fade-in">
              {workers.map((w, i) => {
                const selected = selectedWorkers.includes(w.id)
                return (
                  <button
                    key={w.id}
                    onClick={() => toggleWorker(w.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-b border-[#F1F5F9] last:border-0 ${selected ? 'bg-blue-50/40' : ''}`}
                  >
                    <Avatar initials={w.avatar} size="sm" index={i} />
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-slate-800">{w.name}</p>
                      <p className="text-xs text-slate-400">{w.role} · {w.status === 'available' ? 'Available' : w.status === 'working' ? 'Currently working' : 'Off duty'}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selected ? 'bg-[#1E3A5F] border-[#1E3A5F]' : 'border-slate-300'}`}>
                      {selected && <Check size={11} className="text-white" />}
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {selectedWorkers.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {selectedWorkers.map(id => {
                const w = workers.find(w => w.id === id)
                if (!w) return null
                return (
                  <div key={id} className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-full pl-1.5 pr-2 py-0.5">
                    <Avatar initials={w.avatar} size="sm" index={workers.indexOf(w)} />
                    <span className="text-xs font-medium text-blue-700">{w.name.split(' ')[0]}</span>
                    <button onClick={() => toggleWorker(id)} className="text-blue-400 hover:text-blue-600">
                      <X size={11} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Notes & Attachments */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6">
          <h2 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#1E3A5F] text-white flex items-center justify-center text-[10px] font-bold">5</span>
            Notes & Attachments
          </h2>
          <Textarea
            label="Additional Notes"
            placeholder="Access instructions, equipment needed, special requirements..."
            value={form.notes}
            onChange={v => setForm(f => ({ ...f, notes: v }))}
            rows={4}
          />
          <button className="mt-3 flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 border border-dashed border-slate-300 rounded-lg w-full py-3 px-4 hover:bg-slate-50 transition-colors">
            <Paperclip size={14} />
            Attach files, documents or images
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 justify-end pt-2 pb-6">
          <Button variant="outline" onClick={() => onNavigate('jobs')}>Cancel</Button>
          <Button variant="secondary" onClick={() => handleSave(false)}>Save as Draft</Button>
          <Button onClick={() => handleSave(true)}>Publish Job</Button>
        </div>
      </div>
    </div>
  )
}
