import { describe, expect, it } from 'vitest'
import { calculateStats, getProgressScopeId } from './progress'
import type { Word, WordStatus } from './types'

const words: Word[] = ['a', 'b', 'c', 'd'].map((id) => ({
  id,
  setId: 'set-01',
  translations: { en: id, ru: id, es: id },
}))

describe('calculateStats', () => {
  it('uses a separate scope for each ordered language pair', () => {
    expect(getProgressScopeId('set-01', { from: 'en', to: 'ru' })).toBe('set-01:en-ru')
    expect(getProgressScopeId('set-01', { from: 'ru', to: 'en' })).toBe('set-01:ru-en')
    expect(getProgressScopeId('set-01', { from: 'en', to: 'es' })).not.toBe(getProgressScopeId('set-01', { from: 'en', to: 'ru' }))
  })
  it('counts every status and calculates remaining words', () => {
    const statuses = new Map<string, WordStatus>([
      ['b', 'mastered'],
      ['c', 'uncertain'],
      ['d', 'incorrect'],
    ])
    expect(calculateStats(words, statuses)).toEqual({
      unseen: 1,
      mastered: 1,
      uncertain: 1,
      incorrect: 1,
      remaining: 3,
    })
  })

  it('keeps the thousand-word totals mathematically consistent', () => {
    const thousandWords: Word[] = Array.from({ length: 1000 }, (_, index) => ({
      id: String(index),
      setId: 'set-01',
      translations: { en: '', ru: '', es: '' },
    }))
    const statuses = new Map<string, WordStatus>()
    for (let index = 0; index < 4; index += 1) statuses.set(String(index), 'mastered')
    for (let index = 4; index < 6; index += 1) statuses.set(String(index), 'uncertain')
    for (let index = 6; index < 11; index += 1) statuses.set(String(index), 'incorrect')

    const stats = calculateStats(thousandWords, statuses)
    expect(stats).toEqual({ unseen: 989, mastered: 4, uncertain: 2, incorrect: 5, remaining: 996 })
    expect(stats.unseen + stats.mastered + stats.uncertain + stats.incorrect).toBe(1000)
  })
})
