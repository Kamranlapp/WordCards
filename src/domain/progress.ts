import type { SetStats, Word, WordStatus } from './types'
import type { LanguageDirection } from './types'

export function getProgressScopeId(setId: string, direction: LanguageDirection) {
  return `${setId}:${direction.from}-${direction.to}`
}

export function getStatus(wordId: string, statuses: Map<string, WordStatus>): WordStatus {
  return statuses.get(wordId) ?? 'unseen'
}

export function calculateStats(words: Word[], statuses: Map<string, WordStatus>): SetStats {
  const stats: SetStats = { unseen: 0, uncertain: 0, incorrect: 0, mastered: 0, remaining: 0 }

  for (const word of words) {
    stats[getStatus(word.id, statuses)] += 1
  }
  stats.remaining = words.length - stats.mastered
  return stats
}
