import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from 'firebase/firestore'

const rules = readFileSync(
  new URL('../firestore.rules', import.meta.url),
  'utf8',
)
let environment: RulesTestEnvironment

function validRecord() {
  const now = new Date('2026-09-12T08:00:00.000Z')
  return {
    dutyId: 4,
    incomplete: false,
    occurredAt: now,
    note: '',
    createdAt: now,
    updatedAt: now,
  }
}

beforeAll(async () => {
  environment = await initializeTestEnvironment({
    projectId: 'demo-ff14-mentor',
    firestore: { rules },
  })
})

beforeEach(async () => environment.clearFirestore())
afterAll(async () => environment.cleanup())

describe('Firestore record ownership rules', () => {
  it('lets a user create, list, read, update, and delete their own records', async () => {
    const db = environment.authenticatedContext('alice').firestore()
    const recordRef = doc(db, 'users/alice/records/one')
    await assertSucceeds(setDoc(recordRef, validRecord()))
    await assertSucceeds(getDoc(recordRef))
    await assertSucceeds(getDocs(collection(db, 'users/alice/records')))
    await assertSucceeds(
      updateDoc(recordRef, {
        dutyId: 2,
        incomplete: true,
        note: 'updated',
        updatedAt: new Date(),
      }),
    )
    await assertSucceeds(deleteDoc(recordRef))
  })

  it('denies anonymous access and cross-user access', async () => {
    const anonymous = environment.unauthenticatedContext().firestore()
    const alice = environment.authenticatedContext('alice').firestore()
    await assertFails(
      setDoc(doc(anonymous, 'users/alice/records/one'), validRecord()),
    )
    await assertFails(getDoc(doc(alice, 'users/bob/records/one')))
  })

  it('rejects malformed records and notes over 500 characters', async () => {
    const db = environment.authenticatedContext('alice').firestore()
    await assertFails(
      setDoc(doc(db, 'users/alice/records/bad-type'), {
        ...validRecord(),
        dutyId: '4',
      }),
    )
    await assertFails(
      setDoc(doc(db, 'users/alice/records/extra'), {
        ...validRecord(),
        extra: true,
      }),
    )
    await assertFails(
      setDoc(doc(db, 'users/alice/records/long-note'), {
        ...validRecord(),
        note: 'a'.repeat(501),
      }),
    )
    await assertFails(
      setDoc(doc(db, 'users/alice/records/bad-completion'), {
        ...validRecord(),
        incomplete: 'no',
      }),
    )
  })

  it('prevents changing creation and occurrence timestamps', async () => {
    const db = environment.authenticatedContext('alice').firestore()
    const recordRef = doc(db, 'users/alice/records/one')
    await assertSucceeds(setDoc(recordRef, validRecord()))
    await assertFails(
      updateDoc(recordRef, {
        occurredAt: new Date('2026-09-11T08:00:00.000Z'),
      }),
    )
    await assertFails(
      updateDoc(recordRef, { createdAt: new Date('2026-09-11T08:00:00.000Z') }),
    )
  })
})
