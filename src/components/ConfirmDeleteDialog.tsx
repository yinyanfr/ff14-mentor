import { AlertTriangle } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface ConfirmDeleteDialogProps {
  dutyName: string
  onClose: () => void
  onConfirm: () => Promise<void>
}

export function ConfirmDeleteDialog({
  dutyName,
  onClose,
  onConfirm,
}: ConfirmDeleteDialogProps) {
  const { t } = useTranslation()
  const [deleting, setDeleting] = useState(false)

  async function confirm() {
    setDeleting(true)
    try {
      await onConfirm()
      onClose()
    } catch {
      // Keep the confirmation open; the records provider renders the error message.
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        className="modal-card confirm-card"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
      >
        <span className="warning-icon" aria-hidden="true">
          <AlertTriangle size={22} />
        </span>
        <h2 id="delete-dialog-title">{t('record.deleteTitle')}</h2>
        <p>{t('record.deleteMessage', { duty: dutyName })}</p>
        <footer className="modal-actions">
          <button
            className="button secondary"
            type="button"
            onClick={onClose}
            disabled={deleting}
          >
            {t('actions.cancel')}
          </button>
          <button
            className="button danger-button"
            type="button"
            onClick={() => void confirm()}
            disabled={deleting}
          >
            {t('actions.confirmDelete')}
          </button>
        </footer>
      </section>
    </div>
  )
}
