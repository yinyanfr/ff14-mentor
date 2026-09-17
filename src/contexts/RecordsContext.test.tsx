import { act, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { loadLocalRecords, saveLocalRecords } from '../lib/localRecords'
import type { DutyRecord } from '../types'
import { RecordsProvider, useRecords } from './RecordsContext'

const mocks = vi.hoisted(() => ({
  authState: {
    user: null as { uid: string } | null,
    loading: false,
  },
  upload: vi.fn(),
  subscribe: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  unsubscribe: vi.fn(),
  onRecords: undefined as undefined | ((records: DutyRecord[]) => void),
}))

vi.mock('./AuthContext', () => ({
  useAuth: () => mocks.authState,
}))

vi.mock('../lib/cloudRecords', () => ({
  uploadGuestRecords: mocks.upload,
  subscribeToCloudRecords: mocks.subscribe,
  createCloudRecord: mocks.create,
  updateCloudRecord: mocks.update,
  deleteCloudRecord: mocks.remove,
}))

function wrapper({ children }: PropsWithChildren) {
  return <RecordsProvider>{children}</RecordsProvider>
}

function record(id: string, dutyId = 4): DutyRecord {
  const timestamp = `2026-09-${id === 'guest' ? '12' : '11'}T08:00:00.000Z`
  return {
    id,
    dutyId,
    job: null,
    incomplete: false,
    joinedInProgress: false,
    occurredAt: timestamp,
    note: '',
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

describe('record storage switching and merge', () => {
  beforeEach(() => {
    window.localStorage.clear()
    mocks.authState.user = null
    mocks.authState.loading = false
    mocks.onRecords = undefined
    mocks.unsubscribe.mockReset()
    mocks.upload.mockReset().mockResolvedValue(undefined)
    mocks.create.mockReset().mockResolvedValue(undefined)
    mocks.update.mockReset().mockResolvedValue(undefined)
    mocks.remove.mockReset().mockResolvedValue(undefined)
    mocks.subscribe.mockReset().mockImplementation((_uid, onRecords) => {
      mocks.onRecords = onRecords
      return mocks.unsubscribe
    })
  })

  it('performs guest CRUD and persists each change locally', async () => {
    const { result } = renderHook(() => useRecords(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    let created: DutyRecord | undefined
    await act(async () => {
      created = await result.current.addRecord(4, 'PLD')
    })
    expect(loadLocalRecords()).toHaveLength(1)

    await act(async () => {
      await result.current.updateRecord(created!.id, {
        dutyId: 2,
        job: 'WHM',
        incomplete: true,
        joinedInProgress: true,
        note: 'updated',
      })
    })
    expect(loadLocalRecords()[0]).toMatchObject({
      dutyId: 2,
      job: 'WHM',
      incomplete: true,
      joinedInProgress: true,
      note: 'updated',
    })

    await act(async () => result.current.deleteRecord(created!.id))
    expect(loadLocalRecords()).toEqual([])
  })

  it('uploads guest UUIDs, clears local data, and merges cloud records', async () => {
    const guest = record('guest')
    const cloud = record('cloud', 2)
    saveLocalRecords([guest])
    mocks.authState.user = { uid: 'alice' }
    mocks.subscribe.mockImplementation((_uid, onRecords) => {
      mocks.onRecords = onRecords
      onRecords([guest, cloud])
      return mocks.unsubscribe
    })

    const { result } = renderHook(() => useRecords(), { wrapper })

    await waitFor(() => expect(result.current.records).toHaveLength(2))
    expect(mocks.upload).toHaveBeenCalledWith('alice', [guest])
    expect(loadLocalRecords()).toEqual([])
    expect(result.current.syncing).toBe(false)
  })

  it('retains all local data after a failed merge and retries idempotently', async () => {
    const guest = record('guest')
    saveLocalRecords([guest])
    mocks.authState.user = { uid: 'alice' }
    mocks.upload
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue(undefined)
    mocks.subscribe.mockImplementation((_uid, onRecords) => {
      mocks.onRecords = onRecords
      onRecords([guest])
      return mocks.unsubscribe
    })

    const { result } = renderHook(() => useRecords(), { wrapper })
    await waitFor(() => expect(result.current.errorKey).toBe('auth.syncFailed'))
    expect(loadLocalRecords()).toEqual([guest])

    act(() => result.current.retrySync())

    await waitFor(() => expect(mocks.upload).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(result.current.errorKey).toBeNull())
    expect(mocks.upload.mock.calls[0][1][0].id).toBe(guest.id)
    expect(mocks.upload.mock.calls[1][1][0].id).toBe(guest.id)
    expect(loadLocalRecords()).toEqual([])
  })

  it('accepts real-time cloud updates and returns to guest storage on logout', async () => {
    const cloud = record('cloud')
    mocks.authState.user = { uid: 'alice' }
    const { result, rerender } = renderHook(() => useRecords(), { wrapper })
    await waitFor(() => expect(mocks.onRecords).toBeTypeOf('function'))

    act(() => mocks.onRecords?.([cloud]))
    expect(result.current.records).toEqual([cloud])

    mocks.authState.user = null
    rerender()

    await waitFor(() => expect(result.current.records).toEqual([]))
    expect(mocks.unsubscribe).toHaveBeenCalledOnce()
  })
})
