import { dutyById, getDutyName, isMainScenarioDuty } from '../data/duties'
import { jobs } from '../data/jobs'
import type { DutyRecord, DutyType, Job, Locale } from '../types'

export type DutyCategory = DutyType | 'mainScenario'

const dutyCategories: DutyCategory[] = [
  'leveling_dungeon',
  'level_cap_dungeon',
  'mainScenario',
  'trial',
  'extreme_trial',
  'normal_raid',
  'alliance_raid',
  'guildhest',
]

export function localDateKey(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function splitHomeRecords(records: DutyRecord[], now = new Date()) {
  const todayKey = localDateKey(now)
  const today = records.filter(
    (record) => localDateKey(record.occurredAt) === todayKey,
  )
  const recent = records
    .filter((record) => localDateKey(record.occurredAt) !== todayKey)
    .slice(0, 20)
  return { today, recent }
}

export function calculateMentorProgress(recordCount: number) {
  return Math.min(Math.max(recordCount, 0) / 2000, 1) * 100
}

export function countCompletedRecords(records: DutyRecord[]) {
  return records.reduce(
    (count, record) => count + (record.incomplete ? 0 : 1),
    0,
  )
}

export function buildDutyStats(records: DutyRecord[], locale: Locale) {
  const counts = new Map<number, number>()
  for (const record of records) {
    counts.set(record.dutyId, (counts.get(record.dutyId) ?? 0) + 1)
  }

  return [...counts.entries()]
    .map(([dutyId, count]) => {
      const duty = dutyById.get(dutyId)
      return duty
        ? {
            dutyId,
            count,
            name: getDutyName(duty, locale),
            type: duty.type,
            percentage: records.length ? (count / records.length) * 100 : 0,
          }
        : null
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort(
      (left, right) =>
        right.count - left.count || left.name.localeCompare(right.name),
    )
}

export function buildTypeStats(records: DutyRecord[]) {
  const initial = Object.fromEntries(
    dutyCategories.map((type) => [type, 0]),
  ) as Record<DutyCategory, number>

  for (const record of records) {
    const duty = dutyById.get(record.dutyId)
    if (duty) {
      const category = isMainScenarioDuty(record.dutyId)
        ? 'mainScenario'
        : duty.type
      initial[category] += 1
    }
  }

  return dutyCategories.map((type) => ({ type, count: initial[type] }))
}

export function buildJobStats(records: DutyRecord[]) {
  const counts = new Map<Job | null, number>()
  for (const record of records) {
    counts.set(record.job, (counts.get(record.job) ?? 0) + 1)
  }

  return [...counts.entries()]
    .map(([job, count]) => ({
      job,
      count,
      percentage: records.length ? (count / records.length) * 100 : 0,
    }))
    .sort(
      (left, right) =>
        right.count - left.count ||
        (left.job === null ? -1 : jobs.indexOf(left.job)) -
          (right.job === null ? -1 : jobs.indexOf(right.job)),
    )
}

export function findMostUsedJobs<T extends { count: number }>(stats: T[]) {
  const highestCount = stats[0]?.count
  return highestCount === undefined
    ? []
    : stats.filter((item) => item.count === highestCount)
}

export function buildDailyStats(
  records: DutyRecord[],
  now = new Date(),
  days = 30,
) {
  const counts = new Map<string, number>()
  for (const record of records) {
    const key = localDateKey(record.occurredAt)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(now)
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - (days - 1 - index))
    const key = localDateKey(date)
    return { date, key, count: counts.get(key) ?? 0 }
  })
}
