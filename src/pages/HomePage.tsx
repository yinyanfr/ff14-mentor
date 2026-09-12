import {
  CalendarDays,
  Cloud,
  HardDrive,
  LoaderCircle,
  Target,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { ConfirmDeleteDialog } from '../components/ConfirmDeleteDialog'
import { DutySearch } from '../components/DutySearch'
import { EditRecordDialog } from '../components/EditRecordDialog'
import { RecordList } from '../components/RecordList'
import { useAuth } from '../contexts/AuthContext'
import { usePreferences } from '../contexts/PreferencesContext'
import { useRecords } from '../contexts/RecordsContext'
import { dutyById, getDutyName } from '../data/duties'
import {
  calculateMentorProgress,
  countCompletedRecords,
  splitHomeRecords,
} from '../lib/stats'
import type { DutyRecord } from '../types'

export function HomePage() {
  const { t } = useTranslation()
  const { locale } = usePreferences()
  const { user } = useAuth()
  const {
    records,
    loading,
    syncing,
    errorKey,
    addRecord,
    updateRecord,
    deleteRecord,
    retrySync,
    clearError,
  } = useRecords()
  const [editingRecord, setEditingRecord] = useState<DutyRecord | null>(null)
  const [deletingRecord, setDeletingRecord] = useState<DutyRecord | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const { today, recent } = useMemo(() => splitHomeRecords(records), [records])
  const completedCount = useMemo(
    () => countCompletedRecords(records),
    [records],
  )
  const progress = calculateMentorProgress(completedCount)
  const dateLabel = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date())

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 2800)
    return () => window.clearTimeout(timer)
  }, [toast])

  const deletingDuty = deletingRecord
    ? dutyById.get(deletingRecord.dutyId)
    : undefined

  return (
    <div className="home-page page-stack">
      <section className="hero-card">
        <div className="hero-copy">
          <span className="section-kicker">FINAL FANTASY XIV</span>
          <h1>{t('app.fullName')}</h1>
          <p>{t('app.tagline')}</p>
        </div>

        {user && (
          <div
            className="hero-avatar"
            aria-label={t('auth.signedInAs', { name: user.email })}
          >
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName ?? user.email ?? ''}
                referrerPolicy="no-referrer"
              />
            ) : (
              <span aria-hidden="true">
                {(user.displayName ?? user.email ?? '?')
                  .slice(0, 1)
                  .toUpperCase()}
              </span>
            )}
          </div>
        )}

        <div className={`storage-status${user ? ' signed-in-status' : ''}`}>
          {user ? <Cloud size={16} /> : <HardDrive size={16} />}
          <span>
            <strong>
              {user ? (user.displayName ?? user.email) : t('auth.guest')}
            </strong>
            <small>
              {user
                ? t('auth.signedInAs', { name: user.email })
                : t('auth.guestHint')}
            </small>
          </span>
        </div>

        <div className="search-card">
          <DutySearch
            disabled={loading || syncing}
            onSelect={async (duty) => {
              await addRecord(duty.content_finder_condition_id)
              setToast(t('home.added', { duty: getDutyName(duty, locale) }))
            }}
          />
          <p className="search-hint">{t('home.searchHint')}</p>
        </div>
      </section>

      {syncing && (
        <div className="status-banner syncing-banner" role="status">
          <LoaderCircle className="spin" size={18} />
          {t('auth.syncing')}
        </div>
      )}

      {errorKey && (
        <div className="status-banner error-banner" role="alert">
          <span>{t(errorKey)}</span>
          <span className="banner-actions">
            {errorKey === 'auth.syncFailed' && (
              <button type="button" onClick={retrySync}>
                {t('actions.retry')}
              </button>
            )}
            <button
              type="button"
              onClick={clearError}
              aria-label={t('actions.close')}
            >
              ×
            </button>
          </span>
        </div>
      )}

      <section className="progress-card">
        <div className="progress-heading">
          <span className="progress-icon" aria-hidden="true">
            <Target size={21} />
          </span>
          <span>
            <small>{t('home.progressLabel')}</small>
            <strong>
              {completedCount.toLocaleString(locale)} <span>/ 2,000</span>
            </strong>
          </span>
          <span className="progress-percent">{Math.floor(progress)}%</span>
        </div>
        <div
          className="progress-track"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={2000}
          aria-valuenow={Math.min(completedCount, 2000)}
          aria-label={t('home.progressHint')}
        >
          <span style={{ width: `${progress}%` }} />
        </div>
        <p>{t('home.progressHint')}</p>
      </section>

      <section className="records-section">
        <header className="section-heading">
          <div>
            <span className="section-kicker">
              <CalendarDays size={14} /> {dateLabel}
            </span>
            <h2>{t('home.today')}</h2>
          </div>
          <span className="count-badge">{today.length}</span>
        </header>
        {loading ? (
          <div className="loading-card">
            <LoaderCircle className="spin" size={22} />
          </div>
        ) : (
          <RecordList
            records={today}
            emptyMessage={t('home.emptyToday')}
            onEdit={setEditingRecord}
            onDelete={setDeletingRecord}
          />
        )}
      </section>

      {!loading && (
        <section className="records-section recent-section">
          <header className="section-heading">
            <h2>{t('home.recent')}</h2>
            <span className="count-badge">{recent.length}</span>
          </header>
          <RecordList
            records={recent}
            emptyMessage={t('home.emptyRecent')}
            onEdit={setEditingRecord}
            onDelete={setDeletingRecord}
          />
        </section>
      )}

      {editingRecord && (
        <EditRecordDialog
          key={editingRecord.id}
          record={editingRecord}
          onClose={() => setEditingRecord(null)}
          onSave={(update) => updateRecord(editingRecord.id, update)}
        />
      )}

      {deletingRecord && (
        <ConfirmDeleteDialog
          dutyName={
            deletingDuty
              ? getDutyName(deletingDuty, locale)
              : t('record.unknownDuty')
          }
          onClose={() => setDeletingRecord(null)}
          onConfirm={() => deleteRecord(deletingRecord.id)}
        />
      )}

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </div>
  )
}
