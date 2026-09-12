import { initializeApp } from 'firebase/app'
import { browserLocalPersistence, getAuth, setPersistence } from 'firebase/auth'

const firebaseConfig = {
  projectId: 'ff14-mentor',
  appId: '1:339825591268:web:8fa806b3455beea3127df1',
  storageBucket: 'ff14-mentor.firebasestorage.app',
  apiKey: 'AIzaSyBtIjMoucZOK0L4gVNuSek81lA4aWp42JY',
  authDomain: 'ff14-mentor.firebaseapp.com',
  messagingSenderId: '339825591268',
  measurementId: 'G-7PKWPE9PCJ',
}

export const firebaseApp = initializeApp(firebaseConfig)
export const auth = getAuth(firebaseApp)

export const authPersistenceReady = setPersistence(
  auth,
  browserLocalPersistence,
)
