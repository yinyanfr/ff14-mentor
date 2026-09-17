import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { EditRecordDialog } from './EditRecordDialog'
import { RecordList } from './RecordList'
import { PreferencesProvider } from '../contexts/PreferencesContext'
import i18n from '../i18n'
import type { DutyRecord } from '../types'

const record: DutyRecord = {
  id: 'one',
  dutyId: 4,
  job: 'PLD',
  incomplete: true,
  joinedInProgress: true,
  occurredAt: '2026-09-12T08:00:00.000Z',
  note: '',
  createdAt: '2026-09-12T08:00:00.000Z',
  updatedAt: '2026-09-12T08:00:00.000Z',
}

describe('incomplete records', () => {
  beforeEach(async () => i18n.changeLanguage('zh-CN'))

  it('shows an incomplete tag in record lists', () => {
    const { container } = render(
      <PreferencesProvider>
        <RecordList
          records={[record]}
          emptyMessage="empty"
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      </PreferencesProvider>,
    )

    expect(screen.getByText('未完成')).toBeInTheDocument()
    expect(screen.getByText('中途加入')).toBeInTheDocument()
    expect(screen.getByText('Lv 15')).toBeInTheDocument()
    expect(container.querySelector('.record-job-avatar img')).toHaveAttribute(
      'src',
      '/assets/job-icons/Paladin.png',
    )
  })

  it('allows the incomplete state to be changed while editing', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(undefined)
    const onClose = vi.fn()
    render(
      <PreferencesProvider>
        <EditRecordDialog
          record={{
            ...record,
            incomplete: false,
            joinedInProgress: false,
          }}
          onSave={onSave}
          onClose={onClose}
        />
      </PreferencesProvider>,
    )

    await user.click(screen.getByRole('checkbox', { name: /未完成/ }))
    await user.click(screen.getByRole('checkbox', { name: /中途加入/ }))
    await user.click(screen.getByRole('button', { name: /职业: 骑士/ }))
    await user.click(screen.getByRole('option', { name: /白魔法师/ }))
    await user.click(screen.getByRole('button', { name: '保存修改' }))

    expect(onSave).toHaveBeenCalledWith({
      dutyId: 4,
      job: 'WHM',
      incomplete: true,
      joinedInProgress: true,
      note: '',
    })
    expect(onClose).toHaveBeenCalledOnce()
  })
})
