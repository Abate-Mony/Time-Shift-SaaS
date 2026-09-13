import { cn } from '@/lib/utils'
import { useTheme, type ThemeMode } from '@/providers/ThemeProvider'
import { Check, Monitor, Moon, Sun } from 'lucide-react'

const OPTIONS: { value: ThemeMode; label: string; description: string; icon: typeof Sun }[] = [
    { value: 'light', label: 'Light', description: 'Bright interface, best in well-lit rooms', icon: Sun },
    { value: 'dark', label: 'Dark', description: 'Dimmed interface, easier on the eyes at night', icon: Moon },
    { value: 'system', label: 'System', description: 'Match your device’s appearance setting', icon: Monitor },
]

export default function AppearanceSettings() {
    const { theme, setTheme } = useTheme()

    return (
        <div className="p-6 max-w-3xl mx-auto animate-fade-in">
            <div className="bg-card rounded-xl border border-border p-6 min-w-0">
                <p className="text-sm font-semibold text-foreground mb-0.5">Theme</p>
                <p className="text-xs text-muted-foreground mb-5">Choose how INPRN looks on this device.</p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {OPTIONS.map(opt => {
                        const isActive = theme === opt.value
                        return (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => setTheme(opt.value)}
                                className={cn(
                                    'relative flex flex-col items-start gap-2.5 rounded-xl border p-4 text-left transition-colors',
                                    isActive
                                        ? 'border-primary bg-primary/5'
                                        : 'border-border hover:bg-muted'
                                )}
                            >
                                {isActive && (
                                    <span className="absolute top-3 right-3 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                                        <Check size={11} className="text-primary-foreground" />
                                    </span>
                                )}
                                <div className={cn(
                                    'w-9 h-9 rounded-lg flex items-center justify-center',
                                    isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                                )}>
                                    <opt.icon size={16} />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-foreground">{opt.label}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
                                </div>
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
