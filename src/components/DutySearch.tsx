import { Search } from 'lucide-react'
import { useId, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { getDutyName, searchDuties } from '../data/duties'
import { usePreferences } from '../contexts/PreferencesContext'
import type { Duty } from '../types'
import { DutyTags } from './DutyTags'

interface DutySearchProps {
  onSelect: (duty: Duty) => void | Promise<void>
  disabled?: boolean
  label?: string
  placeholder?: string
  autoFocus?: boolean
  selectedDuty?: Duty | null
  onClearSelection?: () => void
}

export function DutySearch({
  onSelect,
  disabled = false,
  label,
  placeholder,
  autoFocus = false,
  selectedDuty,
  onClearSelection,
}: DutySearchProps) {
  const { t } = useTranslation()
  const { locale } = usePreferences()
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const listId = useId()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const results = useMemo(() => searchDuties(query, locale), [locale, query])
  const showResults = focused && query.trim().length > 0
  const isControlled = selectedDuty !== undefined
  const inputValue =
    isControlled && selectedDuty ? getDutyName(selectedDuty, locale) : query

  async function selectDuty(duty: Duty) {
    try {
      await onSelect(duty)
      setQuery('')
      setActiveIndex(0)
      if (isControlled) setFocused(false)
    } catch {
      // Keep the query available when persistence fails so the user can retry.
    }
  }

  return (
    <div className="duty-search" ref={wrapperRef}>
      <label htmlFor={`${listId}-input`}>
        {label ?? t('home.searchLabel')}
      </label>
      <div className="search-input-wrap">
        <Search size={21} aria-hidden="true" />
        <input
          id={`${listId}-input`}
          type="search"
          role="combobox"
          autoComplete="off"
          autoFocus={autoFocus}
          disabled={disabled}
          value={inputValue}
          placeholder={placeholder ?? t('home.searchPlaceholder')}
          aria-expanded={showResults}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            showResults && results.length
              ? `${listId}-option-${activeIndex}`
              : undefined
          }
          onFocus={() => setFocused(true)}
          onBlur={() => {
            requestAnimationFrame(() => {
              if (!wrapperRef.current?.contains(document.activeElement))
                setFocused(false)
            })
          }}
          onChange={(event) => {
            if (selectedDuty) {
              onClearSelection?.()
            }
            setQuery(event.target.value)
            setActiveIndex(0)
          }}
          onKeyDown={(event) => {
            if (!showResults || !results.length) return
            if (event.key === 'ArrowDown') {
              event.preventDefault()
              setActiveIndex((index) => (index + 1) % results.length)
            } else if (event.key === 'ArrowUp') {
              event.preventDefault()
              setActiveIndex(
                (index) => (index - 1 + results.length) % results.length,
              )
            } else if (event.key === 'Enter') {
              event.preventDefault()
              void selectDuty(
                results[Math.min(activeIndex, results.length - 1)],
              )
            } else if (event.key === 'Escape') {
              setFocused(false)
            }
          }}
        />
      </div>

      {showResults && (
        <div
          className="search-popover"
          id={listId}
          role="listbox"
          aria-label={t('home.searchResults')}
        >
          {results.length ? (
            results.map((duty, index) => (
              <button
                key={duty.content_finder_condition_id}
                id={`${listId}-option-${index}`}
                className={
                  index === activeIndex
                    ? 'search-result active'
                    : 'search-result'
                }
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => void selectDuty(duty)}
              >
                <span>
                  <strong>{getDutyName(duty, locale)}</strong>
                  <small className="search-result-description">
                    <span>{t(`dutyTypes.${duty.type}`)}</span>
                    <DutyTags dutyId={duty.content_finder_condition_id} />
                  </small>
                </span>
                <span className="duty-meta">
                  {t('duty.level', { level: duty.level.required })} ·{' '}
                  {t('duty.patch', { patch: duty.patch })}
                </span>
              </button>
            ))
          ) : (
            <p className="no-search-results">{t('home.noSearchResults')}</p>
          )}
        </div>
      )}
    </div>
  )
}
