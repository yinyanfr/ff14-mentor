import {
  BarChart3,
  Home,
  LogIn,
  LogOut,
  Moon,
  Sparkles,
  Sun,
} from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { AuthDialog } from './AuthDialog'
import { useAuth } from '../contexts/AuthContext'
import { usePreferences } from '../contexts/PreferencesContext'
import { localeLabels, supportedLocales } from '../i18n'
import type { Locale } from '../types'

const navItems = [
  { to: '/', key: 'nav.home', icon: Home, end: true },
  { to: '/stats', key: 'nav.stats', icon: BarChart3, end: false },
] as const

const localeShortLabels: Record<Locale, string> = {
  'zh-CN': '中',
  'zh-TW': '繁',
  ja: '日',
  en: 'EN',
  de: 'DE',
  fr: 'FR',
  ko: '한',
}

export function AppLayout() {
  const { t } = useTranslation()
  const { locale, setLocale, theme, toggleTheme } = usePreferences()
  const { user, loading, busy, errorKey, logout, clearError } = useAuth()
  const [authOpen, setAuthOpen] = useState(false)

  return (
    <div className="app-shell">
      <header className="app-header">
        <NavLink className="brand" to="/" aria-label={t('app.fullName')}>
          <span className="brand-mark" aria-hidden="true">
            <Sparkles size={18} />
          </span>
          <span>
            <strong>{t('app.name')}</strong>
            <small>FFXIV · MENTOR</small>
          </span>
        </NavLink>

        <nav className="desktop-nav" aria-label="Primary">
          {navItems.map(({ to, key, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}>
              <Icon size={17} />
              {t(key)}
            </NavLink>
          ))}
        </nav>

        <div className="header-actions">
          <label className="language-picker">
            <span className="sr-only">{t('language')}</span>
            <select
              value={locale}
              onChange={(event) => setLocale(event.target.value as Locale)}
              aria-label={t('language')}
            >
              {supportedLocales.map((item) => (
                <option key={item} value={item}>
                  {localeLabels[item]}
                </option>
              ))}
            </select>
            <span className="language-short" aria-hidden="true">
              {localeShortLabels[locale]}
            </span>
          </label>

          <button
            className="icon-button"
            type="button"
            onClick={toggleTheme}
            title={
              theme === 'dark'
                ? t('actions.switchToLight')
                : t('actions.switchToDark')
            }
            aria-label={
              theme === 'dark'
                ? t('actions.switchToLight')
                : t('actions.switchToDark')
            }
          >
            {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
          </button>

          {user ? (
            <div className="account-group">
              {user.photoURL ? (
                <img
                  className="avatar"
                  src={user.photoURL}
                  alt=""
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="avatar avatar-fallback" aria-hidden="true">
                  {(user.displayName ?? user.email ?? '?')
                    .slice(0, 1)
                    .toUpperCase()}
                </span>
              )}
              <button
                className="account-button"
                type="button"
                onClick={() => void logout()}
                disabled={busy}
                title={t('actions.signOut')}
              >
                <span>{user.displayName ?? user.email}</span>
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              className="sign-in-button"
              type="button"
              onClick={() => {
                clearError()
                setAuthOpen(true)
              }}
              disabled={loading || busy}
            >
              <LogIn size={17} />
              <span>{t('actions.signIn')}</span>
            </button>
          )}
        </div>
      </header>

      {errorKey && !authOpen && (
        <div className="global-banner error-banner" role="alert">
          <span>{t(errorKey)}</span>
          <button
            type="button"
            onClick={clearError}
            aria-label={t('actions.close')}
          >
            ×
          </button>
        </div>
      )}

      <main className="page-container">
        <Outlet />
      </main>

      {authOpen && <AuthDialog onClose={() => setAuthOpen(false)} />}

      <nav className="mobile-nav" aria-label="Primary">
        {navItems.map(({ to, key, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end}>
            <Icon size={20} />
            <span>{t(key)}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
