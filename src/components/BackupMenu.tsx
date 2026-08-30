import { useEffect, useId, useRef, useState } from 'react'

interface BackupMenuProps {
  label: string
  saveLabel: string
  restoreLabel: string
  onSave: () => void
  onRestore: (file: File) => void
}

export function BackupMenu(props: BackupMenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return
    const closeOnPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        rootRef.current?.querySelector<HTMLButtonElement>('.backup-menu__trigger')?.focus()
      }
    }
    document.addEventListener('pointerdown', closeOnPointerDown)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnPointerDown)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  const save = () => {
    setOpen(false)
    props.onSave()
  }

  const chooseFile = () => {
    setOpen(false)
    inputRef.current?.click()
  }

  return (
    <div className="backup-menu" ref={rootRef}>
      <button
        className="header-toggle backup-menu__trigger"
        type="button"
        aria-label={props.label}
        title={props.label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((current) => !current)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 3h12l2 2v16H5V3Zm3 0v6h8V3M8 21v-8h8v8" />
        </svg>
      </button>
      {open ? (
        <div className="backup-menu__popover" id={menuId} role="menu">
          <button type="button" role="menuitem" onClick={save}>{props.saveLabel}</button>
          <button type="button" role="menuitem" onClick={chooseFile}>{props.restoreLabel}</button>
        </div>
      ) : null}
      <input
        ref={inputRef}
        className="visually-hidden"
        type="file"
        accept=".json,application/json"
        tabIndex={-1}
        onChange={(event) => {
          const file = event.currentTarget.files?.[0]
          if (file) props.onRestore(file)
          event.currentTarget.value = ''
        }}
      />
    </div>
  )
}
