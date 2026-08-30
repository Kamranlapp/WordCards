import type { ReactNode } from 'react'

interface ConfirmDialogProps {
  title: string
  children: ReactNode
  confirmLabel: string
  cancelLabel: string
  destructive?: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function ConfirmDialog(props: ConfirmDialogProps) {
  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && props.onCancel()}>
      <section className="dialog" role="alertdialog" aria-modal="true" aria-labelledby="dialog-title">
        <div className="dialog__handle" aria-hidden="true" />
        <h2 id="dialog-title">{props.title}</h2>
        <div className="dialog__body">{props.children}</div>
        <div className="dialog__actions">
          <button className="button button--secondary" type="button" onClick={props.onCancel}>{props.cancelLabel}</button>
          <button className={`button ${props.destructive ? 'button--danger' : 'button--primary'}`} type="button" onClick={props.onConfirm}>{props.confirmLabel}</button>
        </div>
      </section>
    </div>
  )
}
