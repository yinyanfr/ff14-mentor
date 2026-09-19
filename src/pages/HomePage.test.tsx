import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { HomePage } from './HomePage'
import { PreferencesProvider } from '../contexts/PreferencesContext'
import i18n from '../i18n'
import type { DutyRecord } from '../types'

const recordsMocks = vi.hoisted(() => ({
  records: [] as DutyRecord[],
  addRecord: vi.fn(),
  updateRecord: vi.fn(),
  deleteRecord: vi.fn(),
  retrySync: vi.fn(),
  clearError: vi.fn(),
}))

const shareMocks = vi.hoisted(() => ({
  download: vi.fn(),
}))

vi.mock('../contexts/RecordsContext', () => ({
  useRecords: () => ({
    loading: false,
    syncing: false,
    errorKey: null,
    ...recordsMocks,
  }),
}))

vi.mock('../lib/shareImage', () => ({
  downloadTodayShareImage: shareMocks.download,
}))

describe('HomePage record form', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    recordsMocks.records = []
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

  it('shows a spinner while generating and downloading today’s image', async () => {
    let finishSharing: (() => void) | undefined
    shareMocks.download.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishSharing = resolve
        }),
    )
    const timestamp = new Date().toISOString()
    recordsMocks.records = [
      {
        id: 'today',
        dutyId: 4,
        job: 'PLD',
        incomplete: false,
        joinedInProgress: false,
        occurredAt: timestamp,
        note: '',
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ]
    const user = userEvent.setup()
    render(
      <PreferencesProvider>
        <HomePage />
      </PreferencesProvider>,
    )

    await user.click(screen.getByRole('button', { name: '分享今日记录' }))

    expect(shareMocks.download).toHaveBeenCalledWith(
      expect.objectContaining({
        records: recordsMocks.records,
        locale: 'zh-CN',
        filename: expect.stringMatching(/^ff14-mentor-\d{4}-\d{2}-\d{2}\.png$/),
      }),
    )
    expect(
      screen.getByRole('button', { name: '正在生成分享图片' }),
    ).toBeDisabled()

    finishSharing?.()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '分享今日记录' })).toBeEnabled()
    })
  })
})
