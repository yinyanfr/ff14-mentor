import { ChevronDown } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { JobIcon } from './JobIcon'
import { usePreferences } from '../contexts/PreferencesContext'
import { getJobName, jobGroups } from '../data/jobs'
import type { Job } from '../types'

interface JobSelectProps {
  value: Job | null
  onChange: (job: Job | null) => void
  disabled?: boolean
  label?: string
}

export function JobSelect({
  value,
  onChange,
  disabled = false,
  label,
}: JobSelectProps) {
  const { t } = useTranslation()
  const { locale } = usePreferences()
  const [open, setOpen] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)
  const listId = useId()
  const fieldLabel = label ?? t('record.jobLabel')
  const selectedLabel = value ? getJobName(value, locale) : t('jobs.none')

  useEffect(() => {
    function closeOutside(event: PointerEvent) {
      if (!pickerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', closeOutside)
    return () => document.removeEventListener('pointerdown', closeOutside)
  }, [])

  function choose(job: Job | null) {
    onChange(job)
    setOpen(false)
  }

  return (
    <div className="job-field" ref={pickerRef}>
      <span className="job-field-label">{fieldLabel}</span>
      <button
        className="job-select-trigger"
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`${fieldLabel}: ${selectedLabel}`}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setOpen(false)
        }}
      >
        <JobIcon job={value} />
        <span>
          <strong>{selectedLabel}</strong>
          {value && <small>{value}</small>}
        </span>
        <ChevronDown size={17} aria-hidden="true" />
      </button>

      {open && (
        <div className="job-picker-popover" id={listId} role="listbox">
          <button
            className={!value ? 'job-option selected' : 'job-option'}
            type="button"
            role="option"
            aria-selected={!value}
            onClick={() => choose(null)}
          >
            <JobIcon job={null} />
            <span>{t('jobs.none')}</span>
          </button>
          {jobGroups.map((group) => (
            <section className="job-option-group" key={group.role}>
              <h3>{t(`jobRoles.${group.role}`)}</h3>
              <div>
                {group.jobs.map((job) => (
                  <button
                    className={
                      value === job ? 'job-option selected' : 'job-option'
                    }
                    type="button"
                    role="option"
                    aria-selected={value === job}
                    key={job}
                    onClick={() => choose(job)}
                  >
                    <JobIcon job={job} />
                    <span>
                      <strong>{getJobName(job, locale)}</strong>
                      <small>{job}</small>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
