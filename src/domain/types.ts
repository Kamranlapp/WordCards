export type Language = 'en' | 'ru' | 'es'
export type UiLanguage = 'ru' | 'en'
export type Theme = 'light' | 'dark'
export type WordStatus = 'unseen' | 'mastered' | 'uncertain' | 'incorrect'
export type SessionMode = 'continue' | 'repeat'
export type SessionPhase = 'first' | 'second'

export interface LanguageDirection {
  from: Language
  to: Language
}

export interface Word {
  id: string
  setId: string
  translations: Record<Language, string>
}

export interface WordSet {
  id: string
  sheetName: string
  title: string
  order: number
  words: Word[]
}

export interface ProgressRecord {
  id: string
  scopeId: string
  profileId: string
  setId: string
  wordId: string
  direction: LanguageDirection
  status: WordStatus
  updatedAt: number
}

export interface ActiveSession {
  id: string
  profileId: string
  setId: string
  mode: SessionMode
  direction: LanguageDirection
  phase: SessionPhase
  firstQueue: string[]
  secondQueue: string[]
  index: number
  startedAt: number
  updatedAt: number
}

export interface Settings {
  id: 'settings'
  profileId: string
  direction: LanguageDirection
  selectedSetId: string
  interfaceLanguage: UiLanguage
  theme: Theme
}

export interface SetStats {
  unseen: number
  uncertain: number
  incorrect: number
  mastered: number
  remaining: number
}

export interface SessionSummary {
  mastered: number
  uncertain: number
  incorrect: number
}

export const LANGUAGE_LABELS: Record<Language, string> = {
  en: 'English',
  ru: 'Русский',
  es: 'Español',
}

export const LANGUAGE_LABELS_BY_UI: Record<UiLanguage, Record<Language, string>> = {
  ru: { en: 'English', ru: 'Русский', es: 'Español' },
  en: { en: 'English', ru: 'Russian', es: 'Spanish' },
}

export const LANGUAGES: Language[] = ['en', 'ru', 'es']
