import { useTheme } from "@/providers/ThemeProvider"
import { Moon, Sun } from "lucide-react"

const ToggleTheme = () => {
      const { resolvedTheme, setTheme } = useTheme()
  return (
    <div>

           <button
                  onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                  title={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  {resolvedTheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                </button>
    </div>
  )
}

export default ToggleTheme