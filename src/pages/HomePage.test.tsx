import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { HomePage } from './HomePage'
import { PreferencesProvider } from '../contexts/PreferencesContext'
import i18n from '../i18n'

const recordsMocks = vi.hoisted(() => ({
  addRecord: vi.fn(),
  updateRecord: vi.fn(),
  deleteRecord: vi.fn(),
  retrySync: vi.fn(),
  clearError: vi.fn(),
}))

vi.mock('../contexts/RecordsContext', () => ({
  useRecords: () => ({
    records: [],
    loading: false,
    syncing: false,
    errorKey: null,
    ...recordsMocks,
  }),
}))

describe('HomePage record form', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    await i18n.changeLanguage('zh-CN')
  })

  it('selects a duty without saving and locks the form while submitting', async () => {
    let finishSubmission: (() => void) | undefined
    recordsMocks.addRecord.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishSubmission = resolve
        }),
    )
    const user = userEvent.setup()
    render(
      <PreferencesProvider>
        <HomePage />
      </PreferencesProvider>,
    )

    expect(screen.getByText('0.0%')).toBeInTheDocument()
    const dutyInput = screen.getByRole('combobox')
    await user.type(dutyInput, '沙')
    await user.click(screen.getByText('天然要害沙斯塔夏溶洞'))
    await user.click(screen.getByRole('checkbox', { name: '未完成' }))
    await user.click(screen.getByRole('checkbox', { name: '中途加入' }))

    expect(recordsMocks.addRecord).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: '提交记录' })).toBeEnabled()

    await user.click(screen.getByRole('button', { name: '提交记录' }))

    expect(recordsMocks.addRecord).toHaveBeenCalledWith(4, null, true, true)
    expect(screen.getByRole('button', { name: '正在提交…' })).toBeDisabled()
    expect(dutyInput).toBeDisabled()

    finishSubmission?.()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '提交记录' })).toBeDisabled()
    })
    expect(dutyInput).toHaveValue('')
    expect(screen.getByRole('checkbox', { name: '未完成' })).not.toBeChecked()
    expect(screen.getByRole('checkbox', { name: '中途加入' })).not.toBeChecked()
  })
})
