import { describe, expect, it } from 'vitest'

import { resolveLocale } from './i18n'

describe('locale resolution', () => {
  it('maps Traditional Chinese browser locales correctly', () => {
    expect(resolveLocale(['zh-HK'])).toBe('zh-TW')
    expect(resolveLocale(['zh-MO'])).toBe('zh-TW')
    expect(resolveLocale(['zh-CN'])).toBe('zh-CN')
  })

  it('falls through unsupported languages and defaults to English', () => {
    expect(resolveLocale(['es-ES', 'fr-FR'])).toBe('fr')
    expect(resolveLocale(['es-ES'])).toBe('en')
  })
})
