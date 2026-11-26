import { Bed, Briefcase, Building2, Flame, Home, Leaf, Sparkles, SprayCan, Truck, AppWindow, Wrench, Smile, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { TemplateIcon as IconKey } from "@/utils/jobTemplates"

export const TEMPLATE_ICON_MAP: Record<IconKey, { icon: LucideIcon; label: string; tint: string }> = {
  sparkles: { icon: Sparkles, label: "Deep clean", tint: "bg-violet-50 text-violet-700" },
  spray: { icon: SprayCan, label: "General clean", tint: "bg-sky-50 text-sky-700" },
  home: { icon: Home, label: "Home", tint: "bg-emerald-50 text-emerald-700" },
  bed: { icon: Bed, label: "Changeover", tint: "bg-amber-50 text-amber-700" },
  building: { icon: Building2, label: "Office", tint: "bg-blue-50 text-blue-700" },
  window: { icon: AppWindow, label: "Windows", tint: "bg-cyan-50 text-cyan-700" },
  flame: { icon: Flame, label: "Oven", tint: "bg-orange-50 text-orange-700" },
  tooth: { icon: Smile, label: "Clinic", tint: "bg-pink-50 text-pink-700" },
  truck: { icon: Truck, label: "Move", tint: "bg-slate-100 text-slate-700" },
  leaf: { icon: Leaf, label: "Outdoor", tint: "bg-lime-50 text-lime-700" },
  wrench: { icon: Wrench, label: "Repairs", tint: "bg-zinc-100 text-zinc-700" },
  briefcase: { icon: Briefcase, label: "Other", tint: "bg-indigo-50 text-indigo-700" },
}

export function TemplateIcon({ icon, className, size = 18 }: { icon: IconKey; className?: string; size?: number }) {
  const entry = TEMPLATE_ICON_MAP[icon] ?? TEMPLATE_ICON_MAP.sparkles
  const Icon = entry.icon
  return (
    <span className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", entry.tint, className)}>
      <Icon size={size} />
    </span>
  )
}
