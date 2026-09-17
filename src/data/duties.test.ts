import { describe, expect, it } from 'vitest'

import {
  duties,
  getDutyName,
  getDutyTags,
  normalizeSearchText,
  searchDuties,
} from './duties'

describe('duty data and search', () => {
  it('loads all mentor roulette duties with stable unique IDs', () => {
    expect(duties).toHaveLength(290)
    expect(
      new Set(duties.map((duty) => duty.content_finder_condition_id)).size,
    ).toBe(290)
  })

  it('starts returning localized matches from the first character', () => {
    expect(
      searchDuties('沙', 'zh-CN').map((duty) => getDutyName(duty, 'zh-CN')),
    ).toContain('天然要害沙斯塔夏溶洞')
    expect(searchDuties('S', 'en')).toHaveLength(12)
  })

  it('normalizes accents, punctuation, whitespace, and case', () => {
    expect(normalizeSearchText("L'Hypogée de Tam-Tara")).toBe(
      'lhypogeedetamtara',
    )
    expect(searchDuties('hypogee', 'fr')[0]?.content_finder_condition_id).toBe(
      2,
    )
  })

  it('falls back for missing Traditional Chinese and Korean names', () => {
    const missingTraditional = duties.find((duty) => !duty.names.zh_tw)
    const missingKorean = duties.find((duty) => !duty.names.ko)
    expect(missingTraditional && getDutyName(missingTraditional, 'zh-TW')).toBe(
      missingTraditional?.names.zh_cn,
    )
    expect(missingKorean && getDutyName(missingKorean, 'ko')).toBe(
      missingKorean?.names.en,
    )
  })

  it('assigns special tags only to the main scenario and Crystal Tower duties', () => {
    expect([15, 16, 830].map(getDutyTags)).toEqual([
      ['mainScenario'],
      ['mainScenario'],
      ['mainScenario'],
    ])
    expect([92, 102, 111].map(getDutyTags)).toEqual([
      ['crystalTower'],
      ['crystalTower'],
      ['crystalTower'],
    ])
    expect(getDutyTags(4)).toEqual([])
    expect(getDutyTags(68)).toEqual([])
  })

  it('assigns a guildhest tag to every guildhest duty', () => {
    const guildhests = duties.filter((duty) => duty.type === 'guildhest')
    expect(guildhests.length).toBeGreaterThan(0)
    expect(
      guildhests.every((duty) =>
        getDutyTags(duty.content_finder_condition_id).includes('guildhest'),
      ),
    ).toBe(true)
  })
})
