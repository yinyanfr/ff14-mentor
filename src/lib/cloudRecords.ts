import {
  Timestamp,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  writeBatch,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'

import { firebaseApp } from './firebase'
import { isJob } from '../data/jobs'
import type { DutyRecord, RecordUpdate } from '../types'

const db = getFirestore(firebaseApp)

function toFirestoreRecord(record: DutyRecord) {
  return {
    dutyId: record.dutyId,
    ...(record.job ? { job: record.job } : {}),
    incomplete: record.incomplete,
    joinedInProgress: record.joinedInProgress,
    occurredAt: Timestamp.fromDate(new Date(record.occurredAt)),
    note: record.note,
    createdAt: Timestamp.fromDate(new Date(record.createdAt)),
    updatedAt: Timestamp.fromDate(new Date(record.updatedAt)),
  }
}

function fromFirestoreRecord(
  snapshot: QueryDocumentSnapshot<DocumentData>,
): DutyRecord {
  const data = snapshot.data()
  return {
    id: snapshot.id,
    dutyId: data.dutyId as number,
    job: isJob(data.job) ? data.job : null,
    incomplete: data.incomplete === true,
    joinedInProgress: data.joinedInProgress === true,
    occurredAt: (data.occurredAt as Timestamp).toDate().toISOString(),
    note: data.note as string,
    createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
    updatedAt: (data.updatedAt as Timestamp).toDate().toISOString(),
  }
}

export function chunkRecords(records: DutyRecord[], size = 400) {
  return Array.from({ length: Math.ceil(records.length / size) }, (_, index) =>
    records.slice(index * size, (index + 1) * size),
  )
}

export async function uploadGuestRecords(uid: string, records: DutyRecord[]) {
  for (const chunk of chunkRecords(records)) {
    const batch = writeBatch(db)
    for (const record of chunk) {
      batch.set(
        doc(db, 'users', uid, 'records', record.id),
        toFirestoreRecord(record),
      )
    }
    await batch.commit()
  }
}

export function subscribeToCloudRecords(
  uid: string,
  onRecords: (records: DutyRecord[]) => void,
  onError: () => void,
) {
  const recordsQuery = query(
    collection(db, 'users', uid, 'records'),
    orderBy('occurredAt', 'desc'),
  )
  return onSnapshot(
    recordsQuery,
    (snapshot) => onRecords(snapshot.docs.map(fromFirestoreRecord)),
    onError,
  )
}

export async function createCloudRecord(uid: string, record: DutyRecord) {
  await setDoc(
    doc(db, 'users', uid, 'records', record.id),
    toFirestoreRecord(record),
  )
}

export async function updateCloudRecord(
  uid: string,
  id: string,
  update: RecordUpdate,
) {
  await updateDoc(doc(db, 'users', uid, 'records', id), {
    dutyId: update.dutyId,
    job: update.job ?? deleteField(),
    incomplete: update.incomplete,
    joinedInProgress: update.joinedInProgress,
    note: update.note,
    updatedAt: Timestamp.now(),
  })
}

export async function deleteCloudRecord(uid: string, id: string) {
  await deleteDoc(doc(db, 'users', uid, 'records', id))
}
