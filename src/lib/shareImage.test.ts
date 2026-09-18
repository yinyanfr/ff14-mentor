import { describe, expect, it } from 'vitest'

import { calculateShareGrid } from './shareImage'

describe('today share image layout', () => {
  it('uses a square 4 by 4 grid for sixteen records', () => {
    expect(calculateShareGrid(16)).toEqual({ columns: 4, rows: 4 })
  })

  it('keeps other record counts in compact near-square grids', () => {
    expect(calculateShareGrid(1)).toEqual({ columns: 1, rows: 1 })
    expect(calculateShareGrid(5)).toEqual({ columns: 3, rows: 2 })
    expect(calculateShareGrid(20)).toEqual({ columns: 5, rows: 4 })
  })
})
