import { shuffle } from './shuffle'
import type {
  ActiveSession,
  LanguageDirection,
  SessionMode,
  SessionSummary,
  Word,
  WordStatus,
} from './types'

export function getSessionId(input: Pick<ActiveSession, 'setId' | 'mode' | 'direction'>) {
  return `session:${input.setId}:${input.mode}:${input.direction.from}-${input.direction.to}`
}

export function getEligibleWordIds(
  words: Word[],
  statuses: Map<string, WordStatus>,
  mode: SessionMode,
): string[] {
  return words
    .filter((word) => {
      const status = statuses.get(word.id) ?? 'unseen'
      return mode === 'continue'
        ? status === 'unseen'
        : status === 'uncertain' || status === 'incorrect'
    })
    .map((word) => word.id)
}

export function createSession(input: {
  profileId: string
  setId: string
  mode: SessionMode
  direction: LanguageDirection
  wordIds: string[]
  now?: number
}): ActiveSession {
  const now = input.now ?? Date.now()
  return {
    id: getSessionId(input),
    profileId: input.profileId,
    setId: input.setId,
    mode: input.mode,
    direction: input.direction,
    phase: 'first',
    firstQueue: shuffle(input.wordIds),
    secondQueue: [],
    index: 0,
    startedAt: now,
    updatedAt: now,
  }
}

export function currentWordId(session: ActiveSession): string | undefined {
  return session.phase === 'first'
    ? session.firstQueue[session.index]
    : session.secondQueue[session.index]
}

export function answerSession(
  session: ActiveSession,
  wordId: string,
  status: Exclude<WordStatus, 'unseen'>,
  now = Date.now(),
): { session: ActiveSession | null; completed: boolean } {
  const next: ActiveSession = {
    ...session,
    secondQueue: [...session.secondQueue],
    updatedAt: now,
  }

  if (next.phase === 'first' && (status === 'uncertain' || status === 'incorrect')) {
    if (!next.secondQueue.includes(wordId)) next.secondQueue.push(wordId)
  }

  next.index += 1
  const queue = next.phase === 'first' ? next.firstQueue : next.secondQueue
  if (next.index < queue.length) return { session: next, completed: false }

  if (next.phase === 'first' && next.secondQueue.length > 0) {
    return {
      session: {
        ...next,
        phase: 'second',
        secondQueue: shuffle(next.secondQueue),
        index: 0,
      },
      completed: false,
    }
  }

  return { session: null, completed: true }
}

export function buildSummary(wordIds: string[], statuses: Map<string, WordStatus>): SessionSummary {
  const summary: SessionSummary = { mastered: 0, uncertain: 0, incorrect: 0 }
  for (const id of new Set(wordIds)) {
    const status = statuses.get(id)
    if (status && status !== 'unseen') summary[status] += 1
  }
  return summary
}
