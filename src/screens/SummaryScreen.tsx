import { UI_COPY } from '../domain/i18n'
import type { SessionSummary, UiLanguage } from '../domain/types'

interface SummaryScreenProps {
  summary: SessionSummary
  title: string
  uiLanguage: UiLanguage
  onHome: () => void
  onRepeat: () => void
}

export function SummaryScreen({ summary, title, uiLanguage, onHome, onRepeat }: SummaryScreenProps) {
  const copy = UI_COPY[uiLanguage]
  const needsRepeat = summary.uncertain + summary.incorrect > 0
  return (
    <main className="app-shell summary-screen">
      <div className="summary-screen__icon">✓</div>
      <span className="eyebrow">{title}</span>
      <h1>{needsRepeat ? copy.sessionComplete : copy.setMastered}</h1>
      <p>{needsRepeat ? copy.summaryWithMistakes : copy.summaryMastered}</p>
      <dl className="summary-stats">
        <div><dt>{copy.knowSummary}</dt><dd>{summary.mastered}</dd></div>
        <div><dt>{copy.difficult}</dt><dd>{summary.uncertain}</dd></div>
        <div><dt>{copy.mistakes}</dt><dd>{summary.incorrect}</dd></div>
      </dl>
      <div className="summary-screen__actions">
        {needsRepeat ? <button className="button button--primary" type="button" onClick={onRepeat}>{copy.repeatDifficult}</button> : null}
        <button className="button button--secondary" type="button" onClick={onHome}>{copy.home}</button>
      </div>
    </main>
  )
}
