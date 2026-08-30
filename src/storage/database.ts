import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { ActiveSession, ProgressRecord, Settings } from '../domain/types'

interface WordCardsDatabase extends DBSchema {
  settings: {
    key: 'settings'
    value: Settings
  }
  progress: {
    key: string
    value: ProgressRecord
    indexes: { 'by-set': string; 'by-scope': string }
  }
  sessions: {
    key: string
    value: ActiveSession
  }
}

let databasePromise: Promise<IDBPDatabase<WordCardsDatabase>> | undefined

export function getDatabase() {
  databasePromise ??= openDB<WordCardsDatabase>('wordcards-db', 2, {
    upgrade(database, oldVersion, _newVersion, transaction) {
      if (oldVersion < 1) {
        database.createObjectStore('settings', { keyPath: 'id' })
        const progress = database.createObjectStore('progress', { keyPath: 'id' })
        progress.createIndex('by-set', 'setId')
        progress.createIndex('by-scope', 'scopeId')
        database.createObjectStore('sessions', { keyPath: 'id' })
      } else if (oldVersion < 2) {
        const progress = transaction.objectStore('progress')
        progress.createIndex('by-scope', 'scopeId')
        progress.clear()
        transaction.objectStore('sessions').clear()
      }
    },
  })
  return databasePromise
}
