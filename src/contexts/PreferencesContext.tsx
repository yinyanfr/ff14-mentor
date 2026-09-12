import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { persistLocale } from '../i18n'
import type { Locale, Theme } from '../types'

interface PreferencesValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  theme: Theme
  toggleTheme: () => void
}

const PreferencesContext = createContext<PreferencesValue | null>(null)
const THEME_STORAGE_KEY = 'ff14-mentor:theme'

function getInitialTheme(): Theme {
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export function PreferencesProvider({ children }: React.PropsWithChildren) {
  const { i18n } = useTranslation()
  const [theme, setTheme] = useState<Theme>(getInitialTheme)
  const locale = i18n.resolvedLanguage as Locale

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  const value = useMemo<PreferencesValue>(
    () => ({
      locale,
      setLocale: (nextLocale) => {
        persistLocale(nextLocale)
        void i18n.changeLanguage(nextLocale)
      },
      theme,
      toggleTheme: () =>
        setTheme((current) => (current === 'dark' ? 'light' : 'dark')),
    }),
    [i18n, locale, theme],
  )

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  )
}

export function usePreferences() {
  const value = useContext(PreferencesContext)
  if (!value)
    throw new Error('usePreferences must be used inside PreferencesProvider')
  return value
}
