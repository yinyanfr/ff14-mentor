import { describe, expect, it } from 'vitest'

import {
  calculateShareGrid,
  calculateShareLayout,
  getShareRecordBadges,
  getShareSummary,
  layoutShareTitle,
  wrapShareTitle,
} from './shareImage'
import { duties, getDutyName } from '../data/duties'
import type { DutyRecord } from '../types'

const labels = {
  title: '',
  date: '',
  count: (count: number) => `${count} runs`,
  categories: 'Categories',
  incomplete: 'Incomplete',
  joinedInProgress: 'Join in Progress',
  noJob: 'No job',
  dutyType: (type: string) => `type:${type}`,
  dutyTag: (tag: string) => `tag:${tag}`,
}

describe('today share image layout', () => {
  it('uses a balanced grid of square cards for sixteen records', () => {
    expect(calculateShareGrid(16)).toEqual({ columns: 4, rows: 4 })
  })

  it('keeps rows and columns close to an even grid', () => {
    expect(calculateShareGrid(1)).toEqual({ columns: 1, rows: 1 })
    expect(calculateShareGrid(5)).toEqual({ columns: 2, rows: 3 })
    expect(calculateShareGrid(9)).toEqual({ columns: 3, rows: 3 })
    expect(calculateShareGrid(15)).toEqual({ columns: 3, rows: 5 })
    expect(calculateShareGrid(20)).toEqual({ columns: 4, rows: 5 })
  })

  it('uses square cards and reserves space for the chart and QR footer', () => {
    const singleRecord = calculateShareLayout(1)
    const fifteenRecords = calculateShareLayout(15, 3)
    const twentyRecords = calculateShareLayout(20, 3)

    expect(singleRecord).toMatchObject({
      canvasWidth: 720,
      canvasHeight: 856,
      cardWidth: 300,
      cardHeight: 300,
    })
    expect(fifteenRecords).toMatchObject({
      columns: 3,
      rows: 5,
      canvasWidth: 1040,
      canvasHeight: 2112,
      cardWidth: 300,
      cardHeight: 300,
    })
    expect(fifteenRecords.chartTop).toBeGreaterThan(
      fifteenRecords.gridTop + fifteenRecords.rows * fifteenRecords.cardHeight,
    )
    expect(fifteenRecords.footerTop).toBeGreaterThan(
      fifteenRecords.chartTop + fifteenRecords.chartHeight,
    )
    expect(twentyRecords).toMatchObject({
      columns: 4,
      rows: 5,
      canvasWidth: 1354,
      canvasHeight: 2112,
      cardWidth: 300,
      cardHeight: 300,
    })

    for (const [count, layout] of [
      [15, fifteenRecords],
      [20, twentyRecords],
    ] as const) {
      for (let index = 0; index < count; index += 1) {
        const column = index % layout.columns
        const row = Math.floor(index / layout.columns)
        const right =
          layout.paddingX +
          column * (layout.cardWidth + layout.gap) +
          layout.cardWidth
        const bottom =
          layout.gridTop +
          row * (layout.cardHeight + layout.gap) +
          layout.cardHeight
        expect(right).toBeLessThanOrEqual(layout.canvasWidth)
        expect(bottom).toBeLessThan(layout.chartTop)
      }
      expect(layout.footerTop + 150).toBe(layout.canvasHeight)
    }
  })

  it('shows every character of long Chinese duty titles in at most two lines', () => {
    const measureText = (value: string) => Array.from(value).length * 18

    for (const locale of ['zh-CN', 'zh-TW'] as const) {
      for (const duty of duties) {
        const name = getDutyName(duty, locale)
        const lines = wrapShareTitle(name, 268, measureText)
        expect(lines.join('')).toBe(name)
        expect(lines.length).toBeLessThanOrEqual(2)
        expect(lines.every((line) => measureText(line) <= 268)).toBe(true)
        expect(lines.join('')).not.toContain('…')
      }
    }
  })

  it('shrinks the title font when two lines need more room', () => {
    let currentFont = ''
    const context = {
      get font() {
        return currentFont
      },
      set font(value: string) {
        currentFont = value
      },
      measureText(value: string) {
        const fontSize = Number(currentFont.match(/(\d+)px/)?.[1] ?? 18)
        return { width: Array.from(value).length * fontSize }
      },
    } as unknown as CanvasRenderingContext2D
    const name = '突破所有关门，讨伐最深处的敌人！'
    const layout = layoutShareTitle(context, name, 130)

    expect(layout.fontSize).toBeLessThan(18)
    expect(layout.lines).toHaveLength(2)
    expect(layout.lines.join('')).toBe(name)
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
      getShareRecordBadges(record, 'en', labels).map((badge) => badge.text),
    ).toEqual([
      'Lv 50',
      'type:level_cap_dungeon',
      'tag:mainScenario',
      'Paladin',
      'Incomplete',
      'Join in Progress',
    ])
  })

  it('excludes incomplete records from the headline but includes them in categories', () => {
    const timestamp = new Date().toISOString()
    const makeRecord = (
      id: string,
      dutyId: number,
      incomplete: boolean,
    ): DutyRecord => ({
      id,
      dutyId,
      job: null,
      incomplete,
      joinedInProgress: false,
      occurredAt: timestamp,
      note: '',
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    const summary = getShareSummary(
      [
        makeRecord('main-completed', 15, false),
        makeRecord('main-incomplete', 16, true),
        makeRecord('dungeon', 4, false),
      ],
      labels,
    )

    expect(summary.countLabel).toBe('2 runs')
    expect(
      summary.categories.find((item) => item.type === 'mainScenario'),
    ).toMatchObject({
      count: 2,
      name: 'tag:mainScenario',
    })
    expect(
      summary.categories.find((item) => item.type === 'level_cap_dungeon'),
    ).toBeUndefined()
    expect(
      summary.categories.find((item) => item.type === 'leveling_dungeon')
        ?.count,
    ).toBe(1)
  })
})
