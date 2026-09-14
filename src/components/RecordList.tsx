import { Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { JobIcon } from './JobIcon'
import { usePreferences } from '../contexts/PreferencesContext'
import { dutyById, getDutyName } from '../data/duties'
import { getJobName } from '../data/jobs'
import type { DutyRecord } from '../types'

interface RecordListProps {
  records: DutyRecord[]
  emptyMessage: string
  onEdit: (record: DutyRecord) => void
  onDelete: (record: DutyRecord) => void
}

export function RecordList({
  records,
  emptyMessage,
  onEdit,
  onDelete,
}: RecordListProps) {
  const { t } = useTranslation()
  const { locale } = usePreferences()
  const formatter = new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  if (!records.length) return <p className="empty-state">{emptyMessage}</p>

  return (
    <ul className="record-list">
      {records.map((record) => {
        const duty = dutyById.get(record.dutyId)
        const name = duty ? getDutyName(duty, locale) : t('record.unknownDuty')
        return (
          <li key={record.id} className="record-item">
            <JobIcon job={record.job} className="record-job-avatar" />
            <div className="record-main">
              <div className="record-heading">
                <strong>{name}</strong>
                {duty && (
                  <span className="type-chip">
                    {t(`dutyTypes.${duty.type}`)}
                  </span>
                )}
                <span className="job-chip">
                  {record.job ? getJobName(record.job, locale) : t('jobs.none')}
                </span>
                {record.incomplete && (
                  <span className="incomplete-chip">
                    {t('record.incomplete')}
                  </span>
                )}
              </div>
              <time dateTime={record.occurredAt}>
                {formatter.format(new Date(record.occurredAt))}
              </time>
              {record.note && <p>{record.note}</p>}
            </div>
            <div className="record-actions">
              <button
                type="button"
                onClick={() => onEdit(record)}
                aria-label={`${t('actions.edit')}: ${name}`}
                title={t('actions.edit')}
              >
                <Pencil size={17} />
              </button>
              <button
                className="danger"
                type="button"
                onClick={() => onDelete(record)}
                aria-label={`${t('actions.delete')}: ${name}`}
                title={t('actions.delete')}
              >
                <Trash2 size={17} />
              </button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
