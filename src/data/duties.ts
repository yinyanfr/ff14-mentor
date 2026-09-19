import rawDutyData from '../../assets/ff14_mentor_roulette_duties_7.56.json'

import type { Duty, DutyDataset, DutyLocale, DutyType, Locale } from '../types'

export type DutyTag =
  'mainScenario' | 'crystalTower' | 'guildhest' | 'currentVersion'

const dataset = rawDutyData as DutyDataset

export const duties = [...dataset.duties].sort(
  (left, right) => left.sort_key - right.sort_key,
)

export const dutyDataVersion = dataset.meta.game_data_snapshot

export const dutyById = new Map(
  duties.map((duty) => [duty.content_finder_condition_id, duty]),
)

const dutyTagsById = new Map<number, readonly DutyTag[]>([
  [15, ['mainScenario']],
  [16, ['mainScenario']],
  [830, ['mainScenario']],
  [92, ['crystalTower']],
  [102, ['crystalTower']],
  [111, ['crystalTower']],
])

const mainScenarioDutyIds = new Set([15, 16, 830])

export const dutyTypes: DutyType[] = [
  'leveling_dungeon',
  'level_cap_dungeon',
  'trial',
  'extreme_trial',
  'normal_raid',
  'alliance_raid',
  'guildhest',
]

const localeKeys: Record<Locale, DutyLocale> = {
  'zh-CN': 'zh_cn',
  'zh-TW': 'zh_tw',
  ja: 'ja',
  en: 'en',
  de: 'de',
  fr: 'fr',
  ko: 'ko',
}

export function getDutyName(duty: Duty, locale: Locale) {
  const key = localeKeys[locale]
  const fallbackKey: DutyLocale = locale === 'zh-TW' ? 'zh_cn' : 'en'
  return duty.names[key] ?? duty.names[fallbackKey] ?? duty.names.zh_cn ?? ''
}

export function getDutyTags(dutyId: number): readonly DutyTag[] {
  const tags = [...(dutyTagsById.get(dutyId) ?? [])]
  const duty = dutyById.get(dutyId)
  if (duty?.type === 'guildhest') tags.push('guildhest')
  if (duty?.patch.startsWith('7.')) tags.push('currentVersion')
  return tags
}

export function isMainScenarioDuty(dutyId: number) {
  return mainScenarioDutyIds.has(dutyId)
}

export function normalizeSearchText(value: string) {
  return value
    .normalize('NFKD')
    .toLocaleLowerCase()
    .replace(/\p{M}/gu, '')
    .replace(/[\p{P}\p{Z}\s]/gu, '')
}

export function searchDuties(query: string, locale: Locale, limit = 12) {
  const normalizedQuery = normalizeSearchText(query)

  if (!normalizedQuery) {
    return []
  }

  return duties
    .map((duty) => {
      const name = getDutyName(duty, locale)
      const normalizedName = normalizeSearchText(name)
      const matchIndex = normalizedName.indexOf(normalizedQuery)
      return { duty, matchIndex, normalizedName }
    })
    .filter(({ matchIndex }) => matchIndex >= 0)
    .sort((left, right) => {
      const leftStarts = left.matchIndex === 0 ? 0 : 1
      const rightStarts = right.matchIndex === 0 ? 0 : 1
      return (
        leftStarts - rightStarts ||
        left.matchIndex - right.matchIndex ||
        left.normalizedName.length - right.normalizedName.length ||
        left.duty.sort_key - right.duty.sort_key
      )
    })
    .slice(0, limit)
    .map(({ duty }) => duty)
}
