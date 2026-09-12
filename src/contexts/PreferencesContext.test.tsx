import { act, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'

import i18n from '../i18n'
import { PreferencesProvider, usePreferences } from './PreferencesContext'

function wrapper({ children }: PropsWithChildren) {
  return <PreferencesProvider>{children}</PreferencesProvider>
}

describe('preferences', () => {
  beforeEach(async () => {
    window.localStorage.clear()
    delete document.documentElement.dataset.theme
    document.documentElement.style.colorScheme = ''
    await i18n.changeLanguage('en')
  })

  it('persists theme changes and applies them to the document', async () => {
    const { result } = renderHook(() => usePreferences(), { wrapper })
    expect(result.current.theme).toBe('light')

    act(() => result.current.toggleTheme())

    await waitFor(() => {
      expect(window.localStorage.getItem('ff14-mentor:theme')).toBe('dark')
      expect(document.documentElement.dataset.theme).toBe('dark')
      expect(document.documentElement.style.colorScheme).toBe('dark')
    })
  })

  it('persists a user-selected locale', async () => {
    const { result } = renderHook(() => usePreferences(), { wrapper })

    act(() => result.current.setLocale('zh-TW'))

    await waitFor(() => {
      expect(result.current.locale).toBe('zh-TW')
      expect(window.localStorage.getItem('ff14-mentor:locale')).toBe('zh-TW')
    })
  })
})
