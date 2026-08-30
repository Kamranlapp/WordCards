import type { ActiveSession, LanguageDirection, ProgressRecord, Settings, Theme, WordStatus } from '../domain/types'
import { getProgressScopeId } from '../domain/progress'
import { getSessionId } from '../domain/session'
import { getDatabase } from './database'

const DEFAULT_DIRECTION: LanguageDirection = { from: 'en', to: 'ru' }

export async function loadOrCreateSettings(defaultSetId: string): Promise<Settings> {
  const database = await getDatabase()
  const saved = await database.get('settings', 'settings')
  if (saved) {
    const migrated: Settings = {
      ...saved,
      interfaceLanguage: saved.interfaceLanguage ?? 'ru',
      theme: saved.theme ?? getDefaultTheme(),
    }
    if (migrated.interfaceLanguage !== saved.interfaceLanguage || migrated.theme !== saved.theme) {
      await database.put('settings', migrated)
    }
    return migrated
  }
  const settings: Settings = {
    id: 'settings',
    profileId: crypto.randomUUID(),
    direction: DEFAULT_DIRECTION,
    selectedSetId: defaultSetId,
    interfaceLanguage: 'ru',
    theme: getDefaultTheme(),
  }
  await database.put('settings', settings)
  return settings
}

function getDefaultTheme(): Theme {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export async function saveSettings(settings: Settings) {
  await (await getDatabase()).put('settings', settings)
}

export async function loadAllStatuses(): Promise<Record<string, Map<string, WordStatus>>> {
  const records = await (await getDatabase()).getAll('progress')
  const statuses: Record<string, Map<string, WordStatus>> = {}
  for (const record of records) {
    statuses[record.scopeId] ??= new Map()
    statuses[record.scopeId].set(record.wordId, record.status)
  }
  return statuses
}

export async function saveWordStatus(profileId: string, setId: string, direction: LanguageDirection, wordId: string, status: WordStatus) {
  const scopeId = getProgressScopeId(setId, direction)
  const record: ProgressRecord = {
    id: `${profileId}:${scopeId}:${wordId}`,
    scopeId,
    profileId,
    setId,
    wordId,
    direction,
    status,
    updatedAt: Date.now(),
  }
  await (await getDatabase()).put('progress', record)
}

export async function resetSetProgress(setId: string, direction: LanguageDirection) {
  const database = await getDatabase()
  const transaction = database.transaction('progress', 'readwrite')
  let cursor = await transaction.store.index('by-scope').openCursor(getProgressScopeId(setId, direction))
  while (cursor) {
    await cursor.delete()
    cursor = await cursor.continue()
  }
  await transaction.done
}

export async function loadActiveSessions() {
  const database = await getDatabase()
  const sessions = await database.getAll('sessions')
  const legacy = sessions.find((session) => session.id === 'active')
  if (!legacy) return sessions

  const migrated = { ...legacy, id: getSessionId(legacy) }
  const transaction = database.transaction('sessions', 'readwrite')
  transaction.store.delete('active')
  transaction.store.put(migrated)
  await transaction.done
  return sessions.filter((session) => session.id !== 'active').concat(migrated)
}

export async function saveActiveSession(session: ActiveSession) {
  await (await getDatabase()).put('sessions', session)
}

export async function clearActiveSession(sessionId: string) {
  await (await getDatabase()).delete('sessions', sessionId)
}

export async function clearSessionsForSet(setId: string, direction?: LanguageDirection) {
  const database = await getDatabase()
  const transaction = database.transaction('sessions', 'readwrite')
  let cursor = await transaction.store.openCursor()
  while (cursor) {
    if (cursor.value.setId === setId && (!direction || (cursor.value.direction.from === direction.from && cursor.value.direction.to === direction.to))) await cursor.delete()
    cursor = await cursor.continue()
  }
  await transaction.done
}
