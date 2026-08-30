import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BackupMenu } from './BackupMenu'

afterEach(cleanup)

function renderMenu(onSave = vi.fn(), onRestore = vi.fn()) {
  render(<BackupMenu label="Backup" saveLabel="Save" restoreLabel="Restore" onSave={onSave} onRestore={onRestore} />)
  return { onSave, onRestore }
}

describe('BackupMenu', () => {
  it('opens the menu and invokes save', () => {
    const { onSave } = renderMenu()
    fireEvent.click(screen.getByRole('button', { name: 'Backup' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Save' }))
    expect(onSave).toHaveBeenCalledOnce()
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('closes on Escape and returns focus to the trigger', () => {
    renderMenu()
    const trigger = screen.getByRole('button', { name: 'Backup' })
    fireEvent.click(trigger)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('closes when clicking outside', () => {
    renderMenu()
    fireEvent.click(screen.getByRole('button', { name: 'Backup' }))
    fireEvent.pointerDown(document.body)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('passes the selected JSON file to restore', () => {
    const { onRestore } = renderMenu()
    const file = new File(['{}'], 'backup.json', { type: 'application/json' })
    const input = document.querySelector<HTMLInputElement>('input[type="file"]')
    expect(input).not.toBeNull()
    fireEvent.change(input!, { target: { files: [file] } })
    expect(onRestore).toHaveBeenCalledWith(file)
  })
})
