import { useState } from 'react'
import { MapPin, Plus, Search, ChevronRight } from 'lucide-react'
import { Card, Button, Badge } from '../components/ui'

const locations = [
  { id: 'l1', name: 'Canary Wharf', address: 'Canary Wharf, London E14', jobs: 2, active: true },
  { id: 'l2', name: 'Heathrow Terminal 5', address: 'Heathrow Terminal 5, TW6', jobs: 1, active: true },
  { id: 'l3', name: 'Oxford Street', address: 'Oxford Street, London W1', jobs: 1, active: true },
  { id: 'l4', name: 'Waterloo Station', address: 'Waterloo Station, London SE1', jobs: 1, active: false },
  { id: 'l5', name: 'ExCeL London', address: 'ExCeL London, Royal Docks E16', jobs: 1, active: false },
  { id: 'l6', name: 'Westfield Stratford', address: 'Westfield Stratford City, E20', jobs: 1, active: true },
  { id: 'l7', name: 'City of London', address: 'Bank, London EC2', jobs: 1, active: false },
]

export function Locations() {
  const [search, setSearch] = useState('')

  const filtered = locations.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.address.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Locations</h1>
          <p className="text-sm text-slate-500 mt-0.5">{locations.length} sites registered</p>
        </div>
        <Button size="sm"><Plus size={14} /> Add Location</Button>
      </div>

      <div className="relative mb-5">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search locations..."
          className="w-full max-w-sm h-9 pl-9 pr-3 border border-[#E2E8F0] rounded-lg text-sm text-slate-700 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
        />
      </div>

      {/* Map placeholder */}
      <div className="h-52 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center mb-5 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="absolute border border-slate-400" style={{ left: `${i * 14}%`, top: 0, bottom: 0, width: 1 }} />
          ))}
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="absolute border border-slate-400" style={{ top: `${i * 20}%`, left: 0, right: 0, height: 1 }} />
          ))}
        </div>
        {locations.map((loc, i) => (
          <div key={loc.id} className="absolute" style={{ left: `${15 + i * 12}%`, top: `${25 + (i % 3) * 25}%` }}>
            <div className={`w-6 h-6 rounded-full ${loc.active ? 'bg-blue-500' : 'bg-slate-400'} flex items-center justify-center shadow-md border-2 border-white`}>
              <MapPin size={10} className="text-white" fill="white" />
            </div>
          </div>
        ))}
        <div className="relative text-center">
          <MapPin size={20} className="text-slate-400 mx-auto mb-1" />
          <p className="text-xs text-slate-400">Interactive map coming soon</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {filtered.map(loc => (
          <Card key={loc.id} className="p-4" onClick={() => {}}>
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${loc.active ? 'bg-blue-50' : 'bg-slate-100'}`}>
                <MapPin size={16} className={loc.active ? 'text-blue-600' : 'text-slate-400'} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900">{loc.name}</p>
                  {loc.active && <Badge variant="success" dot>Active</Badge>}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{loc.address}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-800">{loc.jobs}</p>
                  <p className="text-[10px] text-slate-400">jobs</p>
                </div>
                <ChevronRight size={14} className="text-slate-300" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
