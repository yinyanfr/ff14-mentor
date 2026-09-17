import { CalendarDays, LoaderCircle, Target } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { ConfirmDeleteDialog } from '../components/ConfirmDeleteDialog'
import { DutySearch } from '../components/DutySearch'
import { EditRecordDialog } from '../components/EditRecordDialog'
import { JobSelect } from '../components/JobSelect'
import { RecordList } from '../components/RecordList'
import { usePreferences } from '../contexts/PreferencesContext'
import { useRecords } from '../contexts/RecordsContext'
import { dutyById, getDutyName } from '../data/duties'
import {
  calculateMentorProgress,
  countCompletedRecords,
  splitHomeRecords,
} from '../lib/stats'
import type { Duty, DutyRecord, Job } from '../types'

export function HomePage() {
  const { t } = useTranslation()
  const { locale } = usePreferences()
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
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [selectedDuty, setSelectedDuty] = useState<Duty | null>(null)
  const [incomplete, setIncomplete] = useState(false)
  const [joinedInProgress, setJoinedInProgress] = useState(false)
  const [submitting, setSubmitting] = useState(false)
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
  const formDisabled = loading || syncing || submitting

  async function submitRecord(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedDuty || formDisabled) return

    setSubmitting(true)
    try {
      await addRecord(
        selectedDuty.content_finder_condition_id,
        selectedJob,
        incomplete,
        joinedInProgress,
      )
      setToast(t('home.added', { duty: getDutyName(selectedDuty, locale) }))
      setSelectedDuty(null)
      setIncomplete(false)
      setJoinedInProgress(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="home-page page-stack">
      <section className="hero-card">
        <div className="hero-copy">
          <span className="section-kicker">FINAL FANTASY XIV</span>
          <h1>{t('app.fullName')}</h1>
          <p>{t('app.tagline')}</p>
        </div>

        <form
          className="search-card record-form"
          aria-busy={submitting}
          onSubmit={(event) => void submitRecord(event)}
        >
          <fieldset className="record-form-fieldset" disabled={formDisabled}>
            <div className="record-entry-fields">
              <JobSelect value={selectedJob} onChange={setSelectedJob} />
              <DutySearch
                selectedDuty={selectedDuty}
                onClearSelection={() => setSelectedDuty(null)}
                onSelect={setSelectedDuty}
              />
            </div>
            <div className="record-form-options">
              <label className="compact-check-option">
                <input
                  type="checkbox"
                  checked={incomplete}
                  onChange={(event) => setIncomplete(event.target.checked)}
                />
                <span>{t('record.incomplete')}</span>
              </label>
              <label className="compact-check-option">
                <input
                  type="checkbox"
                  checked={joinedInProgress}
                  onChange={(event) =>
                    setJoinedInProgress(event.target.checked)
                  }
                />
                <span>{t('record.joinedInProgress')}</span>
              </label>
            </div>
            <div className="record-form-footer">
              <p className="search-hint">{t('home.searchHint')}</p>
              <button
                className="record-submit-button"
                type="submit"
                disabled={!selectedDuty || formDisabled}
              >
                {submitting && <LoaderCircle className="spin" size={18} />}
                {t(submitting ? 'home.submitting' : 'home.submitRecord')}
              </button>
            </div>
          </fieldset>
        </form>
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
          <span className="progress-percent">
            {progress.toLocaleString(locale, {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })}
            %
          </span>
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
