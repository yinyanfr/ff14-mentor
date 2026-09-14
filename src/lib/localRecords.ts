import type { DutyRecord } from '../types'
import { isJob } from '../data/jobs'

const STORAGE_KEY = 'ff14-mentor:records:v1'

interface StoredRecords {
  version: 1
  records: DutyRecord[]
}

function normalizeRecord(value: unknown): DutyRecord | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  const isValid =
    typeof record.id === 'string' &&
    typeof record.dutyId === 'number' &&
    typeof record.occurredAt === 'string' &&
    typeof record.note === 'string' &&
    typeof record.createdAt === 'string' &&
    typeof record.updatedAt === 'string' &&
    (record.incomplete === undefined ||
      typeof record.incomplete === 'boolean') &&
    (record.job === undefined || record.job === null || isJob(record.job))

  if (!isValid) return null
  return {
    id: record.id as string,
    dutyId: record.dutyId as number,
    job: isJob(record.job) ? record.job : null,
    incomplete: record.incomplete === true,
    occurredAt: record.occurredAt as string,
    note: record.note as string,
    createdAt: record.createdAt as string,
    updatedAt: record.updatedAt as string,
  }
}

export function loadLocalRecords(): DutyRecord[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Partial<StoredRecords>
    if (parsed.version !== 1 || !Array.isArray(parsed.records)) return []
    return parsed.records
      .map(normalizeRecord)
      .filter((record): record is DutyRecord => record !== null)
      .sort(sortRecordsNewestFirst)
  } catch {
    return []
  }
}

export function saveLocalRecords(records: DutyRecord[]) {
  const payload: StoredRecords = { version: 1, records }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

export function clearLocalRecords() {
  window.localStorage.removeItem(STORAGE_KEY)
}

export function sortRecordsNewestFirst(left: DutyRecord, right: DutyRecord) {
  return Date.parse(right.occurredAt) - Date.parse(left.occurredAt)
}

export function createDutyRecord(
  dutyId: number,
  job: DutyRecord['job'] = null,
  now = new Date(),
): DutyRecord {
  const timestamp = now.toISOString()
  return {
    id: crypto.randomUUID(),
    dutyId,
    job,
    incomplete: false,
    occurredAt: timestamp,
    note: '',
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

export const localRecordStorageKey = STORAGE_KEY
