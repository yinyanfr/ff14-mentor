import {
  GoogleAuthProvider,
  onAuthStateChanged,
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
  login: () => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthValue | null>(null)

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

  const login = useCallback(async () => {
    setBusy(true)
    setErrorKey(null)
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })

    try {
      await authPersistenceReady
      await signInWithPopup(auth, provider)
    } catch {
      setErrorKey('auth.signInFailed')
      setBusy(false)
    }
  }, [])

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
      login,
      logout,
      clearError: () => setErrorKey(null),
    }),
    [busy, errorKey, loading, login, logout, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
