import type { ActiveSession, ProgressRecord, Settings, WordSet, WordStatus } from '../domain/types'
import { getSessionId } from '../domain/session'
import { getProgressScopeId } from '../domain/progress'
import { getDatabase } from './database'

export const BACKUP_FORMAT = 'wordcards-backup'
export const BACKUP_VERSION = 3

export interface WordCardsBackup {
  format: typeof BACKUP_FORMAT
  version: typeof BACKUP_VERSION
  createdAt: string
  settings: Settings
  progress: ProgressRecord[]
  sessions: ActiveSession[]
}

export function createBackup(settings: Settings, progress: ProgressRecord[], sessions: ActiveSession[]): WordCardsBackup {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    createdAt: new Date().toISOString(),
    settings,
    progress,
    sessions,
  }
}

export function downloadBackup(backup: WordCardsBackup) {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = getBackupFilename(backup.createdAt)
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export function getBackupFilename(createdAt: string) {
  const timestamp = createdAt.slice(0, 19).replace('T', '-').replaceAll(':', '')
  return `wordcards-backup-${timestamp}.json`
}

export function parseBackup(contents: string, sets: WordSet[]): WordCardsBackup {
  let value: unknown
  try {
    value = JSON.parse(contents)
  } catch {
    throw new Error('invalid-json')
  }
  return validateBackup(value, sets)
}

export function validateBackup(value: unknown, sets: WordSet[]): WordCardsBackup {
  if (!isRecord(value)) throw new Error('invalid-backup')
  if (value.format !== BACKUP_FORMAT) throw new Error('invalid-backup')
  if (value.version !== BACKUP_VERSION) throw new Error('unsupported-version')
  if (typeof value.createdAt !== 'string' || !Number.isFinite(Date.parse(value.createdAt))) throw new Error('invalid-backup')

  const setWords = new Map(sets.map((set) => [set.id, new Set(set.words.map((word) => word.id))]))
  const settings = validateSettings(value.settings, setWords)
  if (!Array.isArray(value.progress)) throw new Error('invalid-backup')

  const progress: ProgressRecord[] = []
  const recordIds = new Set<string>()
  for (const item of value.progress) {
    if (!isRecord(item)) throw new Error('invalid-backup')
    const profileId = requireString(item.profileId)
    const setId = requireString(item.setId)
    const wordId = requireString(item.wordId)
    const status = requireStatus(item.status)
    const direction = validateDirection(item.direction)
    const scopeId = getProgressScopeId(setId, direction)
    const id = requireString(item.id)
    if (profileId !== settings.profileId || id !== `${profileId}:${scopeId}:${wordId}` || recordIds.has(id)) throw new Error('invalid-backup')
    if (item.scopeId !== scopeId) throw new Error('invalid-backup')
    if (!setWords.get(setId)?.has(wordId)) throw new Error('unknown-word')
    if (!isTimestamp(item.updatedAt)) throw new Error('invalid-backup')
    recordIds.add(id)
    progress.push({ id, scopeId, profileId, setId, wordId, direction, status, updatedAt: item.updatedAt })
  }

  const sessions = validateSessions(value.sessions, settings.profileId, setWords)

  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    createdAt: value.createdAt,
    settings,
    progress,
    sessions,
  }
}

export async function restoreBackup(backup: WordCardsBackup) {
  const database = await getDatabase()
  const transaction = database.transaction(['settings', 'progress', 'sessions'], 'readwrite')
  const settingsStore = transaction.objectStore('settings')
  const progressStore = transaction.objectStore('progress')
  const sessionsStore = transaction.objectStore('sessions')

  // Queue every operation before the first await. Safari may auto-commit an
  // IndexedDB transaction as soon as its current request queue becomes empty.
  const requests: Array<Promise<unknown>> = [
    settingsStore.clear(),
    progressStore.clear(),
    sessionsStore.clear(),
    settingsStore.put(backup.settings),
    ...backup.progress.map((record) => progressStore.put(record)),
  ]
  requests.push(...backup.sessions.map((session) => sessionsStore.put(session)))

  await Promise.all(requests)
  await transaction.done
}

function validateSettings(value: unknown, setWords: Map<string, Set<string>>): Settings {
  if (!isRecord(value) || value.id !== 'settings') throw new Error('invalid-backup')
  const profileId = requireString(value.profileId)
  const selectedSetId = requireString(value.selectedSetId)
  if (!setWords.has(selectedSetId)) throw new Error('unknown-set')
  const direction = validateDirection(value.direction)
  const interfaceLanguage = requireOneOf(value.interfaceLanguage, ['ru', 'en'] as const)
  const theme = requireOneOf(value.theme, ['light', 'dark'] as const)
  return { id: 'settings', profileId, direction, selectedSetId, interfaceLanguage, theme }
}

function validateSessions(value: unknown, profileId: string, setWords: Map<string, Set<string>>) {
  if (!Array.isArray(value)) throw new Error('invalid-backup')
  const sessions = value.map((session) => validateSession(session, profileId, setWords))
  if (new Set(sessions.map((session) => session.id)).size !== sessions.length) throw new Error('invalid-backup')
  return sessions
}

function validateSession(value: unknown, profileId: string, setWords: Map<string, Set<string>>): ActiveSession {
  if (!isRecord(value) || value.profileId !== profileId) throw new Error('invalid-backup')
  const setId = requireString(value.setId)
  const words = setWords.get(setId)
  if (!words) throw new Error('unknown-set')
  const firstQueue = validateQueue(value.firstQueue, words)
  const secondQueue = validateQueue(value.secondQueue, words, true)
  const phase = requireOneOf(value.phase, ['first', 'second'] as const)
  const queue = phase === 'first' ? firstQueue : secondQueue
  if (!Number.isInteger(value.index) || (value.index as number) < 0 || (value.index as number) >= queue.length) throw new Error('invalid-backup')
  if (!isTimestamp(value.startedAt) || !isTimestamp(value.updatedAt)) throw new Error('invalid-backup')
  const session: ActiveSession = {
    id: '',
    profileId,
    setId,
    mode: requireOneOf(value.mode, ['continue', 'repeat'] as const),
    direction: validateDirection(value.direction),
    phase,
    firstQueue,
    secondQueue,
    index: value.index as number,
    startedAt: value.startedAt,
    updatedAt: value.updatedAt,
  }
  session.id = getSessionId(session)
  if (value.id !== session.id) throw new Error('invalid-backup')
  return session
}

function validateDirection(value: unknown) {
  if (!isRecord(value)) throw new Error('invalid-backup')
  const from = requireOneOf(value.from, ['en', 'ru', 'es'] as const)
  const to = requireOneOf(value.to, ['en', 'ru', 'es'] as const)
  if (from === to) throw new Error('invalid-backup')
  return { from, to }
}

function validateQueue(value: unknown, words: Set<string>, allowEmpty = false) {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0)) throw new Error('invalid-backup')
  const queue = value.map(requireString)
  if (new Set(queue).size !== queue.length || queue.some((wordId) => !words.has(wordId))) throw new Error('unknown-word')
  return queue
}

function requireStatus(value: unknown): WordStatus {
  return requireOneOf(value, ['unseen', 'mastered', 'uncertain', 'incorrect'] as const)
}

function requireOneOf<T extends string>(value: unknown, allowed: readonly T[]): T {
  if (typeof value !== 'string' || !allowed.includes(value as T)) throw new Error('invalid-backup')
  return value as T
}

function requireString(value: unknown): string {
  if (typeof value !== 'string' || value.length === 0) throw new Error('invalid-backup')
  return value
}

function isTimestamp(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
