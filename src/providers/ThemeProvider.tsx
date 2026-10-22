import { createContext, useContext, type ReactNode } from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'
type ResolvedTheme = 'light' | 'dark'

interface ThemeContextValue {
  theme: ThemeMode
  resolvedTheme: ResolvedTheme
  setTheme: (theme: ThemeMode) => void
}

// Dark mode has been removed app-wide — this now always resolves to light,
// regardless of stored preference or OS setting. Kept as a provider (rather
// than deleted outright) so useTheme() call sites don't need touching; the
// dark: Tailwind classes still present throughout the app are inert dead
// code now that .dark is never applied to <html>.
const LIGHT_VALUE: ThemeContextValue = {
  theme: 'light',
  resolvedTheme: 'light',
  setTheme: () => {},
}

const ThemeContext = createContext<ThemeContextValue>(LIGHT_VALUE)

export function ThemeProvider({ children }: { children: ReactNode }) {
  return <ThemeContext.Provider value={LIGHT_VALUE}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  return useContext(ThemeContext)
}
