interface InstallHintProps {
  onClose: () => void
}

export function InstallHint({ onClose }: InstallHintProps) {
  return (
    <div className="dialog-backdrop install-hint-backdrop" role="presentation">
      <section className="dialog install-hint" role="dialog" aria-modal="true" aria-labelledby="install-hint-title">
        <div className="dialog__handle" aria-hidden="true" />
        <button className="install-hint__close" type="button" onClick={onClose} aria-label="Close">×</button>
        <div className="install-hint__icon" aria-hidden="true">↗</div>
        <h2 id="install-hint-title">For a better experience, use WordCards as a web app</h2>
        <ol className="install-hint__steps">
          <li><span>1</span><strong>Open with Safari</strong></li>
          <li><span>2</span><strong>Tap Share <span className="install-hint__share" aria-hidden="true">⇧</span></strong></li>
          <li><span>3</span><strong>Add to Home Screen</strong></li>
        </ol>
        <button className="button button--primary install-hint__button" type="button" onClick={onClose}>Got it</button>
      </section>
    </div>
  )
}
