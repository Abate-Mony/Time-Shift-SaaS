import { useEffect, useRef, useState } from 'react'
import { RecurringJobSection, defaultRecurring, type RecurringState } from '@/components/RecurringJobSection'

export default function DebugRecurring() {
  const [recurring, setRecurring] = useState<RecurringState>({ ...defaultRecurring(), enabled: true, pattern: 'monthly', monthlyMode: 'day-of-week' })
  const boxRef = useRef<HTMLDivElement>(null)
  const [metrics, setMetrics] = useState('')
  useEffect(() => {
    const update = () => {
      const el = boxRef.current
      if (!el) return
      setMetrics(`boxScrollW=${el.scrollWidth} boxClientW=${el.clientWidth} OVERFLOW=${el.scrollWidth > el.clientWidth}`)
    }
    update()
    const t = setInterval(update, 300)
    return () => clearInterval(t)
  }, [recurring])
  return (
    <div>
      <div id="metrics" style={{ background: 'yellow', padding: 8, fontFamily: 'monospace', fontSize: 12 }}>{metrics}</div>
      <div ref={boxRef} style={{ width: 375, overflow: 'hidden', margin: '0 auto', border: '2px solid blue' }}>
        <RecurringJobSection value={recurring} onChange={setRecurring} sectionIndex={4} />
      </div>
    </div>
  )
}
