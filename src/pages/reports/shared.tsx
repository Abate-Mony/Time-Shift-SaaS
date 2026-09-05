/** Shared between report pages that chart data (Overview, Performance). */
export const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
}) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl px-4 py-3 shadow-lg">
      <p className="text-xs text-slate-500 mb-2">{label}</p>
      {payload.map(p => (
        <p key={p.name} className="text-sm font-semibold" style={{ color: p.color }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  )
}
