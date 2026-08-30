import { describe, expect, it, vi } from 'vitest'
import { answerSession, createSession, getEligibleWordIds } from './session'
import type { Word, WordStatus } from './types'

const words: Word[] = ['one', 'two', 'three', 'four'].map((id) => ({
  id,
  setId: 'set-01',
  translations: { en: id, ru: id, es: id },
}))

describe('session selection', () => {
  const statuses = new Map<string, WordStatus>([
    ['two', 'mastered'],
    ['three', 'uncertain'],
    ['four', 'incorrect'],
  ])

  it('selects only unseen words for continue', () => {
    expect(getEligibleWordIds(words, statuses, 'continue')).toEqual(['one'])
  })

  it('selects uncertain and incorrect words for repeat', () => {
    expect(getEligibleWordIds(words, statuses, 'repeat')).toEqual(['three', 'four'])
  })
})

describe('two-pass session', () => {
  it('adds difficult words to one second pass and then completes', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9)
    const session = createSession({
      profileId: 'profile',
      setId: 'set-01',
      mode: 'continue',
      direction: { from: 'en', to: 'ru' },
      wordIds: ['one'],
      now: 1,
    })
    const first = answerSession(session, 'one', 'uncertain', 2)
    expect(first.session?.phase).toBe('second')
    expect(first.session?.secondQueue).toEqual(['one'])
    const second = answerSession(first.session!, 'one', 'incorrect', 3)
    expect(second).toEqual({ session: null, completed: true })
    vi.restoreAllMocks()
  })

  it('completes immediately when all answers are mastered', () => {
    const session = createSession({
      profileId: 'profile',
      setId: 'set-01',
      mode: 'continue',
      direction: { from: 'en', to: 'ru' },
      wordIds: ['one'],
    })
    expect(answerSession(session, 'one', 'mastered').completed).toBe(true)
  })
})
