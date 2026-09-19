import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { DutySearch } from './DutySearch'
import { PreferencesProvider } from '../contexts/PreferencesContext'
import i18n from '../i18n'

describe('DutySearch', () => {
  it('searches after one character and supports keyboard selection', async () => {
    await i18n.changeLanguage('zh-CN')
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(
      <PreferencesProvider>
        <DutySearch onSelect={onSelect} />
      </PreferencesProvider>,
    )

    const input = screen.getByRole('combobox')
    await user.type(input, '沙')
    expect(screen.getByText('天然要害沙斯塔夏溶洞')).toBeInTheDocument()
    await user.keyboard('{Enter}')
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ content_finder_condition_id: 12 }),
    )
  })

  it('shows a controlled selection without saving it implicitly', async () => {
    await i18n.changeLanguage('zh-CN')
    const onSelect = vi.fn()
    const user = userEvent.setup()
    const { rerender } = render(
      <PreferencesProvider>
        <DutySearch selectedDuty={null} onSelect={onSelect} />
      </PreferencesProvider>,
    )

    const input = screen.getByRole('combobox')
    await user.type(input, '沙')
    await user.click(screen.getByText('天然要害沙斯塔夏溶洞'))

    expect(onSelect).toHaveBeenCalledOnce()
    rerender(
      <PreferencesProvider>
        <DutySearch
          selectedDuty={onSelect.mock.calls[0][0]}
          onSelect={onSelect}
        />
      </PreferencesProvider>,
    )
    expect(input).toHaveValue('天然要害沙斯塔夏溶洞')
  })
})
