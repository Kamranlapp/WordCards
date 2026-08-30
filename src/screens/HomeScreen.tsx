import { UI_COPY } from '../domain/i18n'
import type { ActiveSession, LanguageDirection, SetStats, Theme, UiLanguage, WordSet } from '../domain/types'
import { LanguageDirectionPicker } from '../components/LanguageDirectionPicker'
import { WordSetCarousel } from '../components/WordSetCarousel'
import { BackupMenu } from '../components/BackupMenu'

interface HomeScreenProps {
  sets: WordSet[]
  direction: LanguageDirection
  selectedSetId: string
  statsBySet: Record<string, SetStats>
  activeSessions: ActiveSession[]
  uiLanguage: UiLanguage
  theme: Theme
  onDirectionChange: (direction: LanguageDirection) => void
  onSelectSet: (setId: string) => void
  onContinue: (setId: string) => void
  onRepeat: (setId: string) => void
  onReset: (setId: string) => void
  onUiLanguageChange: (language: UiLanguage) => void
  onThemeChange: (theme: Theme) => void
  onBackupSave: () => void
  onBackupRestore: (file: File) => void
}

export function HomeScreen(props: HomeScreenProps) {
  const copy = UI_COPY[props.uiLanguage]
  const nextUiLanguage: UiLanguage = props.uiLanguage === 'ru' ? 'en' : 'ru'
  const languageFlag = props.uiLanguage === 'ru' ? '🇷🇺' : '🇬🇧'
  const languageLabel = props.uiLanguage === 'ru'
    ? 'Switch interface to English'
    : 'Переключить интерфейс на русский'

  return (
    <main className="app-shell home-screen">
      <header className="home-header">
        <img className="home-header__mark" src="/icons/icon-192.png" alt="" />
        <div className="home-header__title"><h1>WordCards</h1><p>{copy.tagline}</p></div>
        <div className="home-controls">
          <button className="header-toggle locale-toggle" type="button" onClick={() => props.onUiLanguageChange(nextUiLanguage)} aria-label={languageLabel} title={languageLabel}>
            <span aria-hidden="true">{languageFlag}</span>
          </button>
          <button className="theme-toggle" type="button" onClick={() => props.onThemeChange(props.theme === 'dark' ? 'light' : 'dark')} aria-label={props.theme === 'dark' ? copy.lightTheme : copy.darkTheme}>
            {props.theme === 'dark' ? '☀' : '☾'}
          </button>
          <BackupMenu
            label={copy.backup}
            saveLabel={copy.backupSave}
            restoreLabel={copy.backupRestore}
            onSave={props.onBackupSave}
            onRestore={props.onBackupRestore}
          />
        </div>
      </header>
      <LanguageDirectionPicker value={props.direction} uiLanguage={props.uiLanguage} onChange={props.onDirectionChange} />
      <WordSetCarousel
        sets={props.sets}
        selectedSetId={props.selectedSetId}
        statsBySet={props.statsBySet}
        activeSessions={props.activeSessions}
        direction={props.direction}
        uiLanguage={props.uiLanguage}
        onSelect={props.onSelectSet}
        onContinue={props.onContinue}
        onRepeat={props.onRepeat}
        onReset={props.onReset}
      />
    </main>
  )
}
