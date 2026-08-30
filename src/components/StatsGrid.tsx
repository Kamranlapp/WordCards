import { UI_COPY } from '../domain/i18n'
import type { SetStats, UiLanguage } from '../domain/types'

export function StatsGrid({ stats, uiLanguage }: { stats: SetStats; uiLanguage: UiLanguage }) {
  const copy = UI_COPY[uiLanguage]
  return (
    <dl className="stats-grid">
      <div><dt>{copy.newWords}</dt><dd>{stats.unseen}</dd></div>
      <div><dt>{copy.difficult}</dt><dd>{stats.uncertain}</dd></div>
      <div><dt>{copy.mistakes}</dt><dd>{stats.incorrect}</dd></div>
      <div><dt>{copy.notMastered}</dt><dd>{stats.remaining}</dd></div>
    </dl>
  )
}
