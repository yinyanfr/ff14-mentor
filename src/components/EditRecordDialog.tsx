import { X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { DutySearch } from './DutySearch'
import { DutyTags } from './DutyTags'
import { JobSelect } from './JobSelect'
import { usePreferences } from '../contexts/PreferencesContext'
import { dutyById, getDutyName } from '../data/duties'
import type { Duty, DutyRecord, RecordUpdate } from '../types'

interface EditRecordDialogProps {
  record: DutyRecord
  onClose: () => void
  onSave: (update: RecordUpdate) => Promise<void>
}

export function EditRecordDialog({
  record,
  onClose,
  onSave,
}: EditRecordDialogProps) {
  const { t } = useTranslation()
  const { locale } = usePreferences()
  const [duty, setDuty] = useState<Duty | undefined>(() =>
    dutyById.get(record.dutyId),
  )
  const [incomplete, setIncomplete] = useState(record.incomplete)
  const [joinedInProgress, setJoinedInProgress] = useState(
    record.joinedInProgress,
  )
  const [job, setJob] = useState(record.job)
  const [note, setNote] = useState(record.note)
  const [saving, setSaving] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!duty) return
    setSaving(true)
    try {
      await onSave({
        dutyId: duty.content_finder_condition_id,
        job,
        incomplete,
        joinedInProgress,
        note: note.trim(),
      })
      onClose()
    } catch {
      // Keep the dialog open; the records provider renders the error message.
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-dialog-title"
      >
        <header>
          <h2 id="edit-dialog-title">{t('record.editTitle')}</h2>
          <button
            className="icon-button"
            type="button"
            onClick={onClose}
            aria-label={t('actions.close')}
          >
            <X size={19} />
          </button>
        </header>
        <form onSubmit={submit}>
          {duty && (
            <div className="selected-duty">
              <span>{getDutyName(duty, locale)}</span>
              <span className="selected-duty-tags">
                <DutyTags dutyId={duty.content_finder_condition_id} />
              </span>
            </div>
          )}
          <DutySearch
            onSelect={setDuty}
            disabled={saving}
            label={t('record.changeDuty')}
          />
          <JobSelect value={job} onChange={setJob} disabled={saving} />
          <div className="record-state-options">
            <label className="completion-option">
              <input
                type="checkbox"
                checked={incomplete}
                onChange={(event) => setIncomplete(event.target.checked)}
                disabled={saving}
              />
              <span>
                <strong>{t('record.incomplete')}</strong>
                <small>{t('record.incompleteHint')}</small>
              </span>
            </label>
            <label className="completion-option joined-option">
              <input
                type="checkbox"
                checked={joinedInProgress}
                onChange={(event) => setJoinedInProgress(event.target.checked)}
                disabled={saving}
              />
              <span>
                <strong>{t('record.joinedInProgress')}</strong>
                <small>{t('record.joinedInProgressHint')}</small>
              </span>
            </label>
          </div>
          <label className="note-field">
            <span>{t('record.noteLabel')}</span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value.slice(0, 500))}
              maxLength={500}
              rows={4}
              placeholder={t('record.notePlaceholder')}
              disabled={saving}
            />
            <small>{t('record.noteCount', { count: note.length })}</small>
          </label>
          <footer className="modal-actions">
            <button
              className="button secondary"
              type="button"
              onClick={onClose}
              disabled={saving}
            >
              {t('actions.cancel')}
            </button>
            <button
              className="button primary"
              type="submit"
              disabled={!duty || saving}
            >
              {t('actions.save')}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}
