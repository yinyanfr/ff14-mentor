import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthDialog } from './AuthDialog'
import { AuthProvider } from '../contexts/AuthContext'
import i18n from '../i18n'

const firebaseMocks = vi.hoisted(() => ({
  createUser: vi.fn(),
  signInWithEmail: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
}))

vi.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: firebaseMocks.createUser,
  GoogleAuthProvider: class {
    setCustomParameters() {}
  },
  onAuthStateChanged: vi.fn(
    (_auth: unknown, callback: (user: null) => void) => {
      callback(null)
      return vi.fn()
    },
  ),
  signInWithEmailAndPassword: firebaseMocks.signInWithEmail,
  signInWithPopup: firebaseMocks.signInWithPopup,
  signOut: firebaseMocks.signOut,
}))

vi.mock('../lib/firebase', () => ({
  auth: {},
  authPersistenceReady: Promise.resolve(),
}))

function renderDialog(onClose = vi.fn()) {
  render(
    <AuthProvider>
      <AuthDialog onClose={onClose} />
    </AuthProvider>,
  )
  return onClose
}

describe('AuthDialog', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    await i18n.changeLanguage('zh-CN')
    firebaseMocks.createUser.mockResolvedValue({})
    firebaseMocks.signInWithEmail.mockResolvedValue({})
    firebaseMocks.signInWithPopup.mockResolvedValue({})
  })

  it('signs in with email and closes after success', async () => {
    const onClose = renderDialog()
    const user = userEvent.setup()

    await user.type(screen.getByLabelText('电子邮箱'), 'mentor@example.com')
    await user.type(screen.getByLabelText('密码'), 'secret12')
    await user.click(screen.getByRole('button', { name: '使用邮箱登录' }))

    await waitFor(() => {
      expect(firebaseMocks.signInWithEmail).toHaveBeenCalledWith(
        {},
        'mentor@example.com',
        'secret12',
      )
    })
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('registers a new email account', async () => {
    const onClose = renderDialog()
    const user = userEvent.setup()

    await user.click(screen.getByRole('tab', { name: '注册' }))
    await user.type(screen.getByLabelText('电子邮箱'), 'new@example.com')
    await user.type(screen.getByLabelText('密码'), 'secret12')
    await user.click(screen.getByRole('button', { name: '创建账户' }))

    await waitFor(() => {
      expect(firebaseMocks.createUser).toHaveBeenCalledWith(
        {},
        'new@example.com',
        'secret12',
      )
    })
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('keeps the dialog open and shows a useful credential error', async () => {
    firebaseMocks.signInWithEmail.mockRejectedValueOnce({
      code: 'auth/invalid-credential',
    })
    const onClose = renderDialog()
    const user = userEvent.setup()

    await user.type(screen.getByLabelText('电子邮箱'), 'mentor@example.com')
    await user.type(screen.getByLabelText('密码'), 'wrong12')
    await user.click(screen.getByRole('button', { name: '使用邮箱登录' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '邮箱或密码不正确。',
    )
    expect(onClose).not.toHaveBeenCalled()
  })
})
