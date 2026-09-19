import { LoaderCircle, LockKeyhole, Mail, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'

import { useAuth } from '../contexts/AuthContext'

interface AuthDialogProps {
  onClose: () => void
}

export function AuthDialog({ onClose }: AuthDialogProps) {
  const { t } = useTranslation()
  const {
    busy,
    errorKey,
    loginWithEmail,
    loginWithGoogle,
    registerWithEmail,
    clearError,
  } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function changeMode(nextMode: 'login' | 'register') {
    setMode(nextMode)
    clearError()
  }

  async function submitEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const succeeded =
      mode === 'login'
        ? await loginWithEmail(email, password)
        : await registerWithEmail(email, password)
    if (succeeded) onClose()
  }

  async function submitGoogle() {
    if (await loginWithGoogle()) onClose()
  }

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (!busy && event.target === event.currentTarget) onClose()
      }}
    >
      <section
        className="modal-card auth-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-dialog-title"
        aria-busy={busy}
      >
        <header className="modal-header">
          <div>
            <span className="section-kicker">FFXIV · MENTOR</span>
            <h2 id="auth-dialog-title">{t('auth.dialogTitle')}</h2>
          </div>
          <button
            className="icon-button"
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label={t('actions.close')}
          >
            <X size={19} />
          </button>
        </header>

        <div className="auth-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            className={mode === 'login' ? 'active' : ''}
            onClick={() => changeMode('login')}
            disabled={busy}
          >
            {t('auth.loginTab')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'register'}
            className={mode === 'register' ? 'active' : ''}
            onClick={() => changeMode('register')}
            disabled={busy}
          >
            {t('auth.registerTab')}
          </button>
        </div>

        <form
          className="auth-form"
          onSubmit={(event) => void submitEmail(event)}
        >
          <label className="auth-field">
            <span>{t('auth.emailLabel')}</span>
            <span className="auth-input-wrap">
              <Mail size={18} aria-hidden="true" />
              <input
                type="email"
                aria-label={t('auth.emailLabel')}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
                disabled={busy}
              />
            </span>
          </label>
          <label className="auth-field">
            <span>{t('auth.passwordLabel')}</span>
            <span className="auth-input-wrap">
              <LockKeyhole size={18} aria-hidden="true" />
              <input
                type="password"
                aria-label={t('auth.passwordLabel')}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={
                  mode === 'login' ? 'current-password' : 'new-password'
                }
                minLength={6}
                required
                disabled={busy}
              />
            </span>
            {mode === 'register' && <small>{t('auth.passwordHint')}</small>}
          </label>

          {errorKey && (
            <p className="auth-error" role="alert">
              {t(errorKey)}
            </p>
          )}

          <button className="auth-submit" type="submit" disabled={busy}>
            {busy && <LoaderCircle className="spin" size={17} />}
            {t(
              mode === 'login'
                ? 'auth.loginWithEmail'
                : 'auth.registerWithEmail',
            )}
          </button>
        </form>

        <div className="auth-divider">
          <span>{t('auth.or')}</span>
        </div>

        <button
          className="google-auth-button"
          type="button"
          onClick={() => void submitGoogle()}
          disabled={busy}
        >
          <span className="google-mark" aria-hidden="true">
            G
          </span>
          {t('auth.googleSignIn')}
        </button>
      </section>
    </div>
  )
}
