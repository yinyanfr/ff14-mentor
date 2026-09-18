import { describe, expect, it } from 'vitest'

import {
  calculateShareGrid,
  calculateShareLayout,
  getShareRecordBadges,
} from './shareImage'
import type { DutyRecord } from '../types'

describe('today share image layout', () => {
  it('uses a balanced grid of wide cards for sixteen records', () => {
    expect(calculateShareGrid(16)).toEqual({ columns: 4, rows: 4 })
  })

  it('keeps rows and columns close to an even grid', () => {
    expect(calculateShareGrid(1)).toEqual({ columns: 1, rows: 1 })
    expect(calculateShareGrid(5)).toEqual({ columns: 2, rows: 3 })
    expect(calculateShareGrid(9)).toEqual({ columns: 3, rows: 3 })
    expect(calculateShareGrid(15)).toEqual({ columns: 3, rows: 5 })
    expect(calculateShareGrid(20)).toEqual({ columns: 4, rows: 5 })
  })

  it('grows the canvas with its content and uses landscape for larger grids', () => {
    const singleRecord = calculateShareLayout(1)
    const fifteenRecords = calculateShareLayout(15)

    expect(singleRecord).toMatchObject({
      canvasWidth: 720,
      canvasHeight: 380,
    })
    expect(fifteenRecords).toMatchObject({
      columns: 3,
      rows: 5,
      canvasWidth: 1220,
      canvasHeight: 836,
    })
    expect(fifteenRecords.canvasWidth).toBeGreaterThan(
      fifteenRecords.canvasHeight,
    )
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
