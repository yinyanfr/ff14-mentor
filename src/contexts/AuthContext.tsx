import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { auth, authPersistenceReady } from '../lib/firebase'

interface AuthValue {
  user: User | null
  loading: boolean
  busy: boolean
  errorKey: string | null
  loginWithGoogle: () => Promise<boolean>
  loginWithEmail: (email: string, password: string) => Promise<boolean>
  registerWithEmail: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthValue | null>(null)

function getAuthErrorKey(error: unknown, fallbackKey: string) {
  const code =
    typeof error === 'object' && error && 'code' in error
      ? String(error.code)
      : ''

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'auth.invalidCredentials'
    case 'auth/email-already-in-use':
      return 'auth.emailInUse'
    case 'auth/weak-password':
      return 'auth.weakPassword'
    case 'auth/invalid-email':
      return 'auth.invalidEmail'
    case 'auth/too-many-requests':
      return 'auth.tooManyRequests'
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return null
    default:
      return fallbackKey
  }
}

export function AuthProvider({ children }: React.PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [errorKey, setErrorKey] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void authPersistenceReady.catch(() => {
      if (active) setErrorKey('auth.signInFailed')
    })

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      if (!active) return
      setUser(nextUser)
      setLoading(false)
      setBusy(false)
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const runAuth = useCallback(
    async (operation: () => Promise<unknown>, fallbackKey: string) => {
      setBusy(true)
      setErrorKey(null)

      try {
        await authPersistenceReady
        await operation()
        return true
      } catch (error) {
        setErrorKey(getAuthErrorKey(error, fallbackKey))
        return false
      } finally {
        setBusy(false)
      }
    },
    [],
  )

  const loginWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })

    return runAuth(() => signInWithPopup(auth, provider), 'auth.signInFailed')
  }, [runAuth])

  const loginWithEmail = useCallback(
    (email: string, password: string) =>
      runAuth(
        () => signInWithEmailAndPassword(auth, email.trim(), password),
        'auth.emailSignInFailed',
      ),
    [runAuth],
  )

  const registerWithEmail = useCallback(
    (email: string, password: string) =>
      runAuth(
        () => createUserWithEmailAndPassword(auth, email.trim(), password),
        'auth.emailSignInFailed',
      ),
    [runAuth],
  )

  const logout = useCallback(async () => {
    setBusy(true)
    setErrorKey(null)
    try {
      await signOut(auth)
    } finally {
      setBusy(false)
    }
  }, [])

  const value = useMemo<AuthValue>(
    () => ({
      user,
      loading,
      busy,
      errorKey,
      loginWithGoogle,
      loginWithEmail,
      registerWithEmail,
      logout,
      clearError: () => setErrorKey(null),
    }),
    [
      busy,
      errorKey,
      loading,
      loginWithEmail,
      loginWithGoogle,
      logout,
      registerWithEmail,
      user,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
