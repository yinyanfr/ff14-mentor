import { describe, expect, it } from 'vitest'

import { calculateShareGrid, getShareRecordBadges } from './shareImage'
import type { DutyRecord } from '../types'

describe('today share image layout', () => {
  it('uses two columns of wide cards for sixteen records', () => {
    expect(calculateShareGrid(16)).toEqual({ columns: 2, rows: 8 })
  })

  it('keeps no more than eight rows in each column', () => {
    expect(calculateShareGrid(1)).toEqual({ columns: 1, rows: 1 })
    expect(calculateShareGrid(5)).toEqual({ columns: 1, rows: 5 })
    expect(calculateShareGrid(9)).toEqual({ columns: 2, rows: 5 })
    expect(calculateShareGrid(20)).toEqual({ columns: 3, rows: 7 })
  })

  it('includes the same duty and record tags as the record list', () => {
    const timestamp = new Date().toISOString()
    const record: DutyRecord = {
      id: 'main-scenario',
      dutyId: 15,
      job: 'PLD',
      incomplete: true,
      joinedInProgress: true,
      occurredAt: timestamp,
      note: '',
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    expect(
      getShareRecordBadges(record, 'en', {
        title: '',
        date: '',
        count: '',
        incomplete: 'Incomplete',
        joinedInProgress: 'Join in Progress',
        noJob: 'No job',
        dutyType: (type) => `type:${type}`,
        dutyTag: (tag) => `tag:${tag}`,
      }).map((badge) => badge.text),
    ).toEqual([
      'Lv 50',
      'type:level_cap_dungeon',
      'tag:mainScenario',
      'Paladin',
      'Incomplete',
      'Join in Progress',
    ])
  })
})
