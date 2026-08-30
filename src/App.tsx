import { useEffect, useMemo, useState } from 'react'
import { ConfirmDialog } from './components/ConfirmDialog'
import { InstallHint } from './components/InstallHint'
import { sheetSnapshotRepository } from './data/sheetSnapshotRepository'
import { calculateStats, getProgressScopeId } from './domain/progress'
import { UI_COPY } from './domain/i18n'
import { answerSession, buildSummary, createSession, currentWordId, getEligibleWordIds, getSessionId } from './domain/session'
import { LANGUAGES } from './domain/types'
import type {
  ActiveSession,
  LanguageDirection,
  ProgressRecord,
  SessionMode,
  SessionSummary,
  Settings,
  Theme,
  UiLanguage,
  WordSet,
  WordStatus,
} from './domain/types'
import { HomeScreen } from './screens/HomeScreen'
import { StudyScreen } from './screens/StudyScreen'
import { SummaryScreen } from './screens/SummaryScreen'
import {
  clearActiveSession,
  clearSessionsForSet,
  loadActiveSessions,
  loadOrCreateSettings,
  loadAllStatuses,
  resetSetProgress,
  saveActiveSession,
  saveSettings,
  saveWordStatus,
} from './storage/stores'
import {
  createBackup,
  downloadBackup,
  parseBackup,
  restoreBackup,
  type WordCardsBackup,
} from './storage/backup'

type Screen = 'home' | 'study' | 'summary'
type StatusMaps = Record<string, Map<string, WordStatus>>
const INSTALL_HINT_SEEN_KEY = 'wordcards-install-hint-seen'

function shouldShowInstallHint() {
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean }
  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    || navigatorWithStandalone.standalone === true

  try {
    return isIos && !isStandalone && localStorage.getItem(INSTALL_HINT_SEEN_KEY) !== 'true'
  } catch {
    return false
  }
}

export default function App() {
  const [sets, setSets] = useState<WordSet[]>([])
  const [settings, setSettings] = useState<Settings>()
  const [statuses, setStatuses] = useState<StatusMaps>({})
  const [sessions, setSessions] = useState<ActiveSession[]>([])
  const [session, setSession] = useState<ActiveSession>()
  const [screen, setScreen] = useState<Screen>('home')
  const [summary, setSummary] = useState<SessionSummary>()
  const [summarySetId, setSummarySetId] = useState<string>()
  const [resetSetId, setResetSetId] = useState<string>()
  const [loadingError, setLoadingError] = useState<string>()
  const [pendingBackup, setPendingBackup] = useState<WordCardsBackup>()
  const [notice, setNotice] = useState<{ message: string; error?: boolean }>()
  const [showInstallHint, setShowInstallHint] = useState(shouldShowInstallHint)
  const storedUiLanguage = settings?.interfaceLanguage
  const storedTheme = settings?.theme

  useEffect(() => {
    let cancelled = false
    async function initialise() {
      try {
        const loadedSets = await sheetSnapshotRepository.listSets()
        const loadedSettings = await loadOrCreateSettings(loadedSets[0].id)
        const loadedSessions = await loadActiveSessions()
        const loadedStatuses = await loadAllStatuses()
        if (!cancelled) {
          setSets(loadedSets)
          setSettings(loadedSettings)
          setStatuses(loadedStatuses)
          setSessions(loadedSessions)
        }
      } catch (error) {
        if (!cancelled) setLoadingError(error instanceof Error ? error.message : 'Не удалось открыть приложение')
      }
    }
    void initialise()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!storedUiLanguage || !storedTheme) return
    document.documentElement.lang = storedUiLanguage
    document.documentElement.dataset.theme = storedTheme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', storedTheme === 'dark' ? '#161a19' : '#f5efe6')
  }, [storedUiLanguage, storedTheme])

  useEffect(() => {
    if (!notice) return
    const timeout = window.setTimeout(() => setNotice(undefined), 3200)
    return () => window.clearTimeout(timeout)
  }, [notice])

  const statsBySet = useMemo(() => Object.fromEntries(
    sets.map((set) => [set.id, calculateStats(set.words, statuses[getProgressScopeId(set.id, settings?.direction ?? { from: 'en', to: 'ru' })] ?? new Map())]),
  ), [sets, statuses, settings?.direction])

  const uiLanguage = settings?.interfaceLanguage ?? 'ru'
  const copy = UI_COPY[uiLanguage]

  if (loadingError) {
    return <main className="app-shell state-screen"><span className="state-screen__icon">!</span><h1>{copy.loadError}</h1><p>{loadingError}</p><button className="button button--primary" type="button" onClick={() => window.location.reload()}>{copy.retry}</button></main>
  }
  if (!settings || sets.length === 0) {
    return <main className="app-shell state-screen"><span className="loader" /><p>{copy.loading}</p></main>
  }

  const selectedSet = sets.find((set) => set.id === settings.selectedSetId) ?? sets[0]
  const studySet = session ? sets.find((set) => set.id === session.setId) : undefined
  const studyWordId = session ? currentWordId(session) : undefined
  const studyWord = studySet?.words.find((word) => word.id === studyWordId)

  const updateSettings = async (next: Settings) => {
    setSettings(next)
    await saveSettings(next)
  }

  const chooseDirection = (direction: LanguageDirection) => {
    void updateSettings({ ...settings, direction })
  }

  const chooseSet = (selectedSetId: string) => {
    void updateSettings({ ...settings, selectedSetId })
  }

  const chooseUiLanguage = (interfaceLanguage: UiLanguage) => {
    void updateSettings({ ...settings, interfaceLanguage })
  }

  const chooseTheme = (theme: Theme) => {
    void updateSettings({ ...settings, theme })
  }

  const closeInstallHint = () => {
    setShowInstallHint(false)
    try {
      localStorage.setItem(INSTALL_HINT_SEEN_KEY, 'true')
    } catch {
      // Dismissing still works when local storage is unavailable.
    }
  }

  const createAndOpenSession = async (setId: string, mode: SessionMode) => {
    const set = sets.find((item) => item.id === setId)
    if (!set) return

    const sessionId = getSessionId({ setId, mode, direction: settings.direction })
    const existing = sessions.find((item) => item.id === sessionId)
    if (existing) {
      setSession(existing)
      setScreen('study')
      return
    }

    const scopeId = getProgressScopeId(setId, settings.direction)
    const wordIds = getEligibleWordIds(set.words, statuses[scopeId] ?? new Map(), mode)
    if (wordIds.length === 0) return
    const next = createSession({
      profileId: settings.profileId,
      setId,
      mode,
      direction: settings.direction,
      wordIds,
    })
    await saveActiveSession(next)
    setSessions((current) => [...current.filter((item) => item.id !== next.id), next])
    setSession(next)
    setScreen('study')
    void navigator.storage?.persist?.()
  }

  const answer = async (status: Exclude<WordStatus, 'unseen'>) => {
    if (!session || !studyWordId) return
    await saveWordStatus(settings.profileId, session.setId, session.direction, studyWordId, status)
    const scopeId = getProgressScopeId(session.setId, session.direction)
    const nextSetStatuses = new Map(statuses[scopeId] ?? new Map())
    nextSetStatuses.set(studyWordId, status)
    const nextStatuses = { ...statuses, [scopeId]: nextSetStatuses }
    setStatuses(nextStatuses)

    const result = answerSession(session, studyWordId, status)
    if (result.session) {
      const nextSession = result.session
      await saveActiveSession(nextSession)
      setSessions((current) => current.map((item) => item.id === nextSession.id ? nextSession : item))
      setSession(nextSession)
      return
    }

    await clearActiveSession(session.id)
    setSessions((current) => current.filter((item) => item.id !== session.id))
    const allIds = [...session.firstQueue, ...session.secondQueue]
    setSummary(buildSummary(allIds, nextSetStatuses))
    setSummarySetId(session.setId)
    setSession(undefined)
    setScreen('summary')
  }

  const confirmReset = async () => {
    if (!resetSetId) return
    const resetDirection = settings.direction
    const resetScopeId = getProgressScopeId(resetSetId, resetDirection)
    await resetSetProgress(resetSetId, resetDirection)
    await clearSessionsForSet(resetSetId, resetDirection)
    if (session?.setId === resetSetId && session.direction.from === resetDirection.from && session.direction.to === resetDirection.to) {
      setSession(undefined)
    }
    setSessions((current) => current.filter((item) => item.setId !== resetSetId || item.direction.from !== resetDirection.from || item.direction.to !== resetDirection.to))
    setStatuses({ ...statuses, [resetScopeId]: new Map() })
    setResetSetId(undefined)
  }

  const repeatSummary = () => {
    if (!summarySetId) return
    setScreen('home')
    void updateSettings({ ...settings, selectedSetId: summarySetId })
    void createAndOpenSession(summarySetId, 'repeat')
  }

  const saveBackupFile = async () => {
    try {
      const timestamp = Date.now()
      const progress: ProgressRecord[] = []
      for (const set of sets) {
        for (const from of LANGUAGES) {
          for (const to of LANGUAGES) {
            if (from === to) continue
            const direction = { from, to }
            const scopeId = getProgressScopeId(set.id, direction)
            for (const [wordId, status] of statuses[scopeId] ?? []) {
              progress.push({
                id: `${settings.profileId}:${scopeId}:${wordId}`,
                scopeId,
                profileId: settings.profileId,
                setId: set.id,
                wordId,
                direction,
                status,
                updatedAt: timestamp,
              })
            }
          }
        }
      }
      downloadBackup(createBackup(settings, progress, sessions))
      setNotice({ message: copy.backupSaved })
    } catch {
      setNotice({ message: copy.backupSaveError, error: true })
    }
  }

  const selectBackupFile = async (file: File) => {
    try {
      if (file.size > 10_000_000) throw new Error('invalid-backup')
      setPendingBackup(parseBackup(await file.text(), sets))
    } catch (error) {
      const reason = error instanceof Error ? error.message : ''
      const message = reason === 'unsupported-version'
        ? copy.backupVersionError
        : reason === 'unknown-set' || reason === 'unknown-word'
          ? copy.backupCompatibilityError
          : reason === 'invalid-json'
            ? copy.backupReadError
            : copy.backupInvalid
      setNotice({ message, error: true })
    }
  }

  const confirmRestore = async () => {
    if (!pendingBackup) return
    try {
      await restoreBackup(pendingBackup)
      const restoredStatuses: StatusMaps = {}
      for (const record of pendingBackup.progress) {
        restoredStatuses[record.scopeId] ??= new Map()
        restoredStatuses[record.scopeId].set(record.wordId, record.status)
      }
      setSettings(pendingBackup.settings)
      setStatuses(restoredStatuses)
      setSessions(pendingBackup.sessions)
      setSession(undefined)
      setScreen('home')
      setSummary(undefined)
      setSummarySetId(undefined)
      setPendingBackup(undefined)
      setNotice({ message: copy.restoreSuccess })
    } catch {
      setNotice({ message: copy.restoreError, error: true })
    }
  }

  return (
    <>
      {screen === 'home' && (
        <HomeScreen
          sets={sets}
          direction={settings.direction}
          selectedSetId={selectedSet.id}
          statsBySet={statsBySet}
          activeSessions={sessions}
          uiLanguage={settings.interfaceLanguage}
          theme={settings.theme}
          onDirectionChange={chooseDirection}
          onSelectSet={chooseSet}
          onContinue={(setId) => void createAndOpenSession(setId, 'continue')}
          onRepeat={(setId) => void createAndOpenSession(setId, 'repeat')}
          onReset={setResetSetId}
          onUiLanguageChange={chooseUiLanguage}
          onThemeChange={chooseTheme}
          onBackupSave={() => void saveBackupFile()}
          onBackupRestore={(file) => void selectBackupFile(file)}
        />
      )}
      {screen === 'study' && session && studySet && studyWord && (
        <StudyScreen set={studySet} word={studyWord} session={session} uiLanguage={settings.interfaceLanguage} onBack={() => setScreen('home')} onAnswer={answer} />
      )}
      {screen === 'summary' && summary && summarySetId && (
        <SummaryScreen
          summary={summary}
          title={settings.interfaceLanguage === 'ru' ? sets.find((set) => set.id === summarySetId)?.title ?? '' : `Level ${sets.find((set) => set.id === summarySetId)?.order ?? ''}`}
          uiLanguage={settings.interfaceLanguage}
          onHome={() => setScreen('home')}
          onRepeat={repeatSummary}
        />
      )}
      {resetSetId && (
        <ConfirmDialog title={copy.resetTitle} confirmLabel={copy.resetSet} cancelLabel={copy.cancel} destructive onCancel={() => setResetSetId(undefined)} onConfirm={() => void confirmReset()}>
          <p>{copy.resetTextStart} «{settings.interfaceLanguage === 'ru' ? sets.find((set) => set.id === resetSetId)?.title : `Level ${sets.find((set) => set.id === resetSetId)?.order ?? ''}`}» {copy.resetTextEnd}</p>
          <p>{copy.irreversible}</p>
        </ConfirmDialog>
      )}
      {pendingBackup && (
        <ConfirmDialog title={copy.restoreTitle} confirmLabel={copy.restoreConfirm} cancelLabel={copy.cancel} destructive onCancel={() => setPendingBackup(undefined)} onConfirm={() => void confirmRestore()}>
          <p>{copy.restoreCreated}: {new Intl.DateTimeFormat(settings.interfaceLanguage === 'ru' ? 'ru-RU' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(pendingBackup.createdAt))}</p>
          <p>{copy.restoreRecords}: {pendingBackup.progress.length}</p>
          <p>{copy.restoreWarning}</p>
        </ConfirmDialog>
      )}
      {showInstallHint && <InstallHint onClose={closeInstallHint} />}
      {notice && <div className={`toast${notice.error ? ' toast--error' : ''}`} role={notice.error ? 'alert' : 'status'}>{notice.message}</div>}
    </>
  )
}
