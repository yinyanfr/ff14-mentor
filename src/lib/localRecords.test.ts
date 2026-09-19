import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  clearLocalRecords,
  createDutyRecord,
  loadLocalRecords,
  localRecordStorageKey,
  saveLocalRecords,
} from './localRecords'

describe('guest record storage', () => {
  beforeEach(() => window.localStorage.clear())

  it('creates records with stable client IDs and timestamps', () => {
    vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue(
      '11111111-1111-4111-8111-111111111111',
    )
    const record = createDutyRecord(
      4,
      'PLD',
      new Date('2026-09-12T08:00:00.000Z'),
    )
    expect(record).toMatchObject({
      id: '11111111-1111-4111-8111-111111111111',
      dutyId: 4,
      job: 'PLD',
      incomplete: false,
      joinedInProgress: false,
      occurredAt: '2026-09-12T08:00:00.000Z',
      note: '',
    })
  })

  it('persists, sorts, and clears versioned local records', () => {
    const older = createDutyRecord(
      4,
      null,
      new Date('2026-09-10T08:00:00.000Z'),
    )
    const newer = createDutyRecord(
      2,
      null,
      new Date('2026-09-11T08:00:00.000Z'),
    )
    saveLocalRecords([older, newer])
    expect(loadLocalRecords().map((record) => record.dutyId)).toEqual([2, 4])
    expect(window.localStorage.getItem(localRecordStorageKey)).toContain(
      '"version":1',
    )
    clearLocalRecords()
    expect(loadLocalRecords()).toEqual([])
  })

  it('ignores malformed storage without throwing', () => {
    window.localStorage.setItem(localRecordStorageKey, '{not-json')
    expect(loadLocalRecords()).toEqual([])
  })

  it('defaults legacy completion and join-in-progress fields to false', () => {
    window.localStorage.setItem(
      localRecordStorageKey,
      JSON.stringify({
        version: 1,
        records: [
          {
            id: 'legacy',
            dutyId: 4,
            occurredAt: '2026-09-12T08:00:00.000Z',
            note: '',
            createdAt: '2026-09-12T08:00:00.000Z',
            updatedAt: '2026-09-12T08:00:00.000Z',
          },
        ],
      }),
    )

    expect(loadLocalRecords()[0]).toMatchObject({
      job: null,
      incomplete: false,
      joinedInProgress: false,
    })
  })
})
