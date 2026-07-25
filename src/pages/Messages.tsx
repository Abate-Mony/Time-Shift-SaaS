import { useState } from 'react'
import { Send, Search } from 'lucide-react'
import { Avatar } from '../components/ui'
import { workers } from '../data/mockData'

const conversations = workers.map((w, i) => ({
  worker: w,
  lastMsg: ['Arrived on site.', 'Running 10 mins late, apologies.', 'Job complete, uploading photos now.', 'Can I swap shifts on Friday?', 'All good, starting now.', 'Need access code for south entrance.'][i],
  time: ['2m ago', '15m ago', '1h ago', '3h ago', '5h ago', '1d ago'][i],
  unread: [2, 1, 0, 0, 0, 0][i],
}))

const initialMessages: Record<string, { from: 'me' | 'them'; text: string; time: string }[]> = {
  w1: [
    { from: 'me', text: 'James, heading to Canary Wharf tonight?', time: '21:50' },
    { from: 'them', text: 'Yes, just leaving now.', time: '21:55' },
    { from: 'them', text: 'Arrived on site.', time: '22:02' },
  ],
  w2: [
    { from: 'them', text: 'Running 10 mins late, apologies.', time: '03:50' },
    { from: 'me', text: 'No problem, client is aware.', time: '03:52' },
  ],
}

export function Messages() {
  const [activeConvo, setActiveConvo] = useState<string>(workers[0].id)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState(initialMessages)
  const [search, setSearch] = useState('')

  const activeWorker = workers.find(w => w.id === activeConvo)
  const currentMessages = messages[activeConvo] ?? []

  const send = () => {
    if (!input.trim()) return
    const now = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    setMessages(m => ({
      ...m,
      [activeConvo]: [...(m[activeConvo] ?? []), { from: 'me', text: input.trim(), time: now }]
    }))
    setInput('')
  }

  const filteredConvos = conversations.filter(c =>
    c.worker.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex h-[calc(100vh-60px)] animate-fade-in">
      {/* Sidebar */}
      <div className="w-72 border-r border-[#E2E8F0] flex flex-col bg-white">
        <div className="p-4 border-b border-[#E2E8F0]">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Messages</h2>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full h-8 pl-8 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredConvos.map((c, i) => (
            <button
              key={c.worker.id}
              onClick={() => setActiveConvo(c.worker.id)}
              className={`w-full flex items-start gap-3 px-4 py-3.5 border-b border-[#F8FAFC] hover:bg-slate-50 transition-colors text-left ${activeConvo === c.worker.id ? 'bg-blue-50/50 border-l-2 border-l-blue-500' : ''}`}
            >
              <Avatar initials={c.worker.avatar} size="md" index={i} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <p className="text-sm font-semibold text-slate-900">{c.worker.name}</p>
                  <p className="text-[10px] text-slate-400">{c.time}</p>
                </div>
                <p className="text-xs text-slate-500 truncate">{c.lastMsg}</p>
              </div>
              {c.unread > 0 && (
                <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{c.unread}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-[#F8FAFC]">
        {/* Chat header */}
        {activeWorker && (
          <div className="h-[60px] bg-white border-b border-[#E2E8F0] flex items-center gap-3 px-5">
            <Avatar initials={activeWorker.avatar} size="md" index={workers.findIndex(w => w.id === activeWorker.id)} />
            <div>
              <p className="text-sm font-semibold text-slate-900">{activeWorker.name}</p>
              <p className="text-xs text-slate-400">{activeWorker.role} · {activeWorker.status === 'working' ? '🟢 Working' : '⚪ Offline'}</p>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
          {currentMessages.length === 0 && (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-slate-400">No messages yet. Say hello!</p>
            </div>
          )}
          {currentMessages.map((msg, i) => (
            <div key={i} className={`flex ${msg.from === 'me' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl ${msg.from === 'me' ? 'bg-[#1E3A5F] text-white rounded-br-sm' : 'bg-white border border-[#E2E8F0] text-slate-800 rounded-bl-sm'}`}>
                <p className="text-sm">{msg.text}</p>
                <p className={`text-[10px] mt-1 ${msg.from === 'me' ? 'text-white/50' : 'text-slate-400'}`}>{msg.time}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-[#E2E8F0] flex items-center gap-3">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Type a message..."
            className="flex-1 h-10 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
          />
          <button
            onClick={send}
            className="w-10 h-10 rounded-xl bg-[#1E3A5F] flex items-center justify-center text-white hover:bg-[#162D4A] transition-colors"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
