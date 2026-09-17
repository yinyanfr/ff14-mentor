import { describe, expect, it } from 'vitest'

import type { DutyRecord } from '../types'
import {
  buildDailyStats,
  buildDutyStats,
  buildJobStats,
  buildTypeStats,
  calculateMentorProgress,
  countCompletedRecords,
  findMostUsedJobs,
  splitHomeRecords,
} from './stats'

function record(
  id: string,
  dutyId: number,
  occurredAt: string,
  incomplete = false,
  job: DutyRecord['job'] = null,
): DutyRecord {
  return {
    id,
    dutyId,
    job,
    incomplete,
    joinedInProgress: false,
    occurredAt,
    note: '',
    createdAt: occurredAt,
    updatedAt: occurredAt,
  }
}

const records = [
  record('a', 4, '2026-09-12T08:00:00.000Z'),
  record('b', 4, '2026-09-12T07:00:00.000Z', true),
  record('c', 2, '2026-09-10T08:00:00.000Z'),
]

describe('record statistics', () => {
  it('splits today from the previous 20 records', () => {
    const result = splitHomeRecords(
      records,
      new Date('2026-09-12T12:00:00.000Z'),
    )
    expect(result.today).toHaveLength(2)
    expect(result.recent).toHaveLength(1)
  })

  it('ranks duties and calculates percentages', () => {
    const result = buildDutyStats(records, 'en')
    expect(result[0]).toMatchObject({ dutyId: 4, count: 2 })
    expect(result[0].percentage).toBeCloseTo(66.67, 1)
    expect(result[0].count).toBe(2)
  })

  it('groups records by type and fills a 30-day trend with zeros', () => {
    const types = buildTypeStats(records)
    expect(types.find((item) => item.type === 'leveling_dungeon')?.count).toBe(
      3,
    )
    const daily = buildDailyStats(records, new Date('2026-09-12T12:00:00.000Z'))
    expect(daily).toHaveLength(30)
    expect(daily.at(-1)?.count).toBe(2)
  })

  it('groups records by job and treats legacy records as no job', () => {
    const withJobs = [
      { ...records[0], job: 'PLD' as const },
      { ...records[1], job: 'PLD' as const },
      records[2],
    ]
    const result = buildJobStats(withJobs)
    expect(result.map(({ job, count }) => ({ job, count }))).toEqual([
      { job: 'PLD', count: 2 },
      { job: null, count: 1 },
    ])
    expect(result[0].percentage).toBeCloseTo(66.67, 1)
    expect(result[1].percentage).toBeCloseTo(33.33, 1)
  })

  it('returns every job tied for the highest usage count', () => {
    expect(
      findMostUsedJobs([
        { job: 'PLD', count: 3 },
        { job: 'WHM', count: 3 },
        { job: null, count: 1 },
      ]),
    ).toEqual([
      { job: 'PLD', count: 3 },
      { job: 'WHM', count: 3 },
    ])
    expect(findMostUsedJobs([])).toEqual([])
  })

  it('caps the 2,000-run progress bar without capping the record count', () => {
    expect(calculateMentorProgress(1_000)).toBe(50)
    expect(calculateMentorProgress(2_001)).toBe(100)
  })

  it('excludes incomplete records only from mentor progress', () => {
    expect(countCompletedRecords(records)).toBe(2)
    expect(
      buildDutyStats(records, 'en').reduce((sum, item) => sum + item.count, 0),
    ).toBe(3)
  })
})
