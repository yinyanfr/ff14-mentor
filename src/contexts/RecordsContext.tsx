import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { useAuth } from './AuthContext'
import {
  clearLocalRecords,
  createDutyRecord,
  loadLocalRecords,
  saveLocalRecords,
  sortRecordsNewestFirst,
} from '../lib/localRecords'
import type { DutyRecord, Job, RecordUpdate } from '../types'

interface RecordsValue {
  records: DutyRecord[]
  loading: boolean
  syncing: boolean
  errorKey: string | null
  addRecord: (dutyId: number, job?: Job | null) => Promise<DutyRecord>
  updateRecord: (id: string, update: RecordUpdate) => Promise<void>
  deleteRecord: (id: string) => Promise<void>
  retrySync: () => void
  clearError: () => void
}

const RecordsContext = createContext<RecordsValue | null>(null)

export function RecordsProvider({ children }: React.PropsWithChildren) {
  const { user, loading: authLoading } = useAuth()
  const [records, setRecords] = useState<DutyRecord[]>([])
  const recordsRef = useRef<DutyRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [errorKey, setErrorKey] = useState<string | null>(null)
  const [syncAttempt, setSyncAttempt] = useState(0)
  const commitRecords = useCallback((nextRecords: DutyRecord[]) => {
    recordsRef.current = nextRecords
    setRecords(nextRecords)
  }, [])

  useEffect(() => {
    if (authLoading) return
    let active = true
    let unsubscribe: () => void = () => undefined

    async function connect() {
      setErrorKey(null)

      if (!user) {
        commitRecords(loadLocalRecords())
        setLoading(false)
        setSyncing(false)
        return
      }

      const guestRecords = loadLocalRecords()
      const cloud = await import('../lib/cloudRecords')
      if (!active) return
      if (guestRecords.length) {
        commitRecords(guestRecords)
        setLoading(false)
        setSyncing(true)
        try {
          await cloud.uploadGuestRecords(user.uid, guestRecords)
          if (!active) return
          clearLocalRecords()
        } catch {
          if (!active) return
          setErrorKey('auth.syncFailed')
          setSyncing(false)
          return
        }
      } else {
        setLoading(true)
      }

      if (!active) return
      setSyncing(false)
      unsubscribe = cloud.subscribeToCloudRecords(
        user.uid,
        (cloudRecords) => {
          if (!active) return
          commitRecords(cloudRecords)
          setLoading(false)
        },
        () => {
          if (!active) return
          setErrorKey('record.saveFailed')
          setLoading(false)
        },
      )
    }

    void connect()
    return () => {
      active = false
      unsubscribe()
    }
  }, [authLoading, commitRecords, syncAttempt, user])

  const addRecord = useCallback(
    async (dutyId: number, job: Job | null = null) => {
      if (syncing) throw new Error('Records are syncing')
      const record = createDutyRecord(dutyId, job)
      const previous = recordsRef.current
      const next = [record, ...previous].sort(sortRecordsNewestFirst)
      commitRecords(next)
      setErrorKey(null)

      try {
        if (user) {
          const cloud = await import('../lib/cloudRecords')
          await cloud.createCloudRecord(user.uid, record)
        } else {
          saveLocalRecords(next)
        }
        return record
      } catch (error) {
        commitRecords(previous)
        setErrorKey('record.saveFailed')
        throw error
      }
    },
    [commitRecords, syncing, user],
  )

  const updateRecord = useCallback(
    async (id: string, update: RecordUpdate) => {
      if (syncing) throw new Error('Records are syncing')
      const previous = recordsRef.current
      const updatedAt = new Date().toISOString()
      const next = previous.map((record) =>
        record.id === id
          ? {
              ...record,
              dutyId: update.dutyId,
              job: update.job,
              incomplete: update.incomplete,
              note: update.note.slice(0, 500),
              updatedAt,
            }
          : record,
      )
      commitRecords(next)
      setErrorKey(null)

      try {
        if (user) {
          const cloud = await import('../lib/cloudRecords')
          await cloud.updateCloudRecord(user.uid, id, {
            dutyId: update.dutyId,
            job: update.job,
            incomplete: update.incomplete,
            note: update.note.slice(0, 500),
          })
        } else {
          saveLocalRecords(next)
        }
      } catch (error) {
        commitRecords(previous)
        setErrorKey('record.saveFailed')
        throw error
      }
    },
    [commitRecords, syncing, user],
  )

  const deleteRecord = useCallback(
    async (id: string) => {
      if (syncing) throw new Error('Records are syncing')
      const previous = recordsRef.current
      const next = previous.filter((record) => record.id !== id)
      commitRecords(next)
      setErrorKey(null)

      try {
        if (user) {
          const cloud = await import('../lib/cloudRecords')
          await cloud.deleteCloudRecord(user.uid, id)
        } else {
          saveLocalRecords(next)
        }
      } catch (error) {
        commitRecords(previous)
        setErrorKey('record.deleteFailed')
        throw error
      }
    },
    [commitRecords, syncing, user],
  )

  const value = useMemo<RecordsValue>(
    () => ({
      records,
      loading: loading || authLoading,
      syncing,
      errorKey,
      addRecord,
      updateRecord,
      deleteRecord,
      retrySync: () => setSyncAttempt((attempt) => attempt + 1),
      clearError: () => setErrorKey(null),
    }),
    [
      addRecord,
      authLoading,
      deleteRecord,
      errorKey,
      loading,
      records,
      syncing,
      updateRecord,
    ],
  )

  return (
    <RecordsContext.Provider value={value}>{children}</RecordsContext.Provider>
  )
}

export function useRecords() {
  const value = useContext(RecordsContext)
  if (!value) throw new Error('useRecords must be used inside RecordsProvider')
  return value
}
