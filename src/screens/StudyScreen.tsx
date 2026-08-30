import { UI_COPY } from '../domain/i18n'
import { LANGUAGE_LABELS_BY_UI, type ActiveSession, type UiLanguage, type Word, type WordSet, type WordStatus } from '../domain/types'
import { FlipCard } from '../components/FlipCard'

interface StudyScreenProps {
  set: WordSet
  word: Word
  session: ActiveSession
  uiLanguage: UiLanguage
  onBack: () => void
  onAnswer: (status: Exclude<WordStatus, 'unseen'>) => Promise<void>
}

export function StudyScreen({ set, word, session, uiLanguage, onBack, onAnswer }: StudyScreenProps) {
  const copy = UI_COPY[uiLanguage]
  const queue = session.phase === 'first' ? session.firstQueue : session.secondQueue
  return (
    <main className="app-shell study-screen">
      <header className="study-header">
        <button className="icon-button" type="button" onClick={onBack} aria-label={copy.back}>←</button>
        <div><strong>{uiLanguage === 'ru' ? set.title : `Level ${set.order}`}</strong><span>{LANGUAGE_LABELS_BY_UI[uiLanguage][session.direction.from]} → {LANGUAGE_LABELS_BY_UI[uiLanguage][session.direction.to]}</span></div>
        <span className="study-header__progress">{session.index + 1} / {queue.length}</span>
      </header>
      <div className="study-phase">{session.phase === 'first' ? copy.firstRound : copy.reviewRound}</div>
      <FlipCard key={`${session.phase}:${session.index}:${word.id}`} word={word} direction={session.direction} uiLanguage={uiLanguage} onAnswer={onAnswer} />
      <p className="study-help">{copy.studyHelp}</p>
    </main>
  )
}
