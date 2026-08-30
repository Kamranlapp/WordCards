import { describe, expect, it } from 'vitest'
import type { WordSet } from '../domain/types'
import { BACKUP_FORMAT, BACKUP_VERSION, createBackup, getBackupFilename, validateBackup } from './backup'

const sets: WordSet[] = [{
  id: 'set-01',
  sheetName: 'Set 1',
  title: 'Первая тысяча',
  order: 1,
  words: [{ id: 'set-01:1', setId: 'set-01', translations: { en: 'one', ru: 'один', es: 'uno' } }],
}]

function validBackup() {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    createdAt: '2026-08-27T10:00:00.000Z',
    settings: {
      id: 'settings',
      profileId: 'profile-1',
      direction: { from: 'en', to: 'ru' },
      selectedSetId: 'set-01',
      interfaceLanguage: 'ru',
      theme: 'light',
    },
    progress: [{
      id: 'profile-1:set-01:en-ru:set-01:1',
      scopeId: 'set-01:en-ru',
      profileId: 'profile-1',
      setId: 'set-01',
      wordId: 'set-01:1',
      direction: { from: 'en', to: 'ru' },
      status: 'mastered',
      updatedAt: 123,
    }],
    sessions: [],
  }
}

describe('backup validation', () => {
  it('creates a full snapshot and a unique timestamped filename', () => {
    const source = validateBackup(validBackup(), sets)
    const backup = createBackup(source.settings, source.progress, source.sessions)
    expect(backup.progress).toEqual(source.progress)
    expect(backup.sessions).toEqual(source.sessions)
    expect(getBackupFilename('2026-08-27T21:54:03.501Z')).toBe('wordcards-backup-2026-08-27-215403.json')
  })

  it('accepts a complete backup without active sessions', () => {
    const backup = validateBackup(validBackup(), sets)
    expect(backup.sessions).toEqual([])
    expect(backup.progress).toHaveLength(1)
  })

  it('accepts multiple compatible active sessions', () => {
    const input = {
      ...validBackup(),
      sessions: [{
        id: 'session:set-01:continue:en-ru',
        profileId: 'profile-1',
        setId: 'set-01',
        mode: 'continue',
        direction: { from: 'en', to: 'ru' },
        phase: 'first',
        firstQueue: ['set-01:1'],
        secondQueue: [],
        index: 0,
        startedAt: 100,
        updatedAt: 123,
      }],
    }
    expect(validateBackup(input, sets).sessions[0]?.setId).toBe('set-01')
  })

  it('rejects old backup versions', () => {
    expect(() => validateBackup({ ...validBackup(), version: 2 }, sets)).toThrow('unsupported-version')
  })

  it('rejects progress for a word that is not in the app', () => {
    const input = validBackup()
    input.progress[0].wordId = 'set-01:missing'
    input.progress[0].id = 'profile-1:set-01:en-ru:set-01:missing'
    expect(() => validateBackup(input, sets)).toThrow('unknown-word')
  })

  it('rejects a progress record from another profile', () => {
    const input = validBackup()
    input.progress[0].profileId = 'profile-2'
    expect(() => validateBackup(input, sets)).toThrow('invalid-backup')
  })
})
