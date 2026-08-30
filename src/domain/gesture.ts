import type { WordStatus } from './types'

export const SWIPE_THRESHOLD = 72
export const TAP_THRESHOLD = 10

export function isTapGesture(x: number, y: number) {
  return Math.hypot(x, y) <= TAP_THRESHOLD
}

export function resolveSwipe(x: number, y: number): Exclude<WordStatus, 'unseen'> | null {
  const absX = Math.abs(x)
  const absY = Math.abs(y)
  if (absX >= absY && x <= -SWIPE_THRESHOLD) return 'mastered'
  if (absX >= absY && x >= SWIPE_THRESHOLD) return 'incorrect'
  if (absY > absX && y <= -SWIPE_THRESHOLD) return 'uncertain'
  return null
}
