import { describe, expect, it } from 'vitest'
import { isTapGesture, resolveSwipe } from './gesture'

describe('isTapGesture', () => {
  it('allows movement up to ten pixels and rejects larger movement', () => {
    expect(isTapGesture(6, 8)).toBe(true)
    expect(isTapGesture(10, 0)).toBe(true)
    expect(isTapGesture(10, 1)).toBe(false)
    expect(isTapGesture(11, 0)).toBe(false)
  })
})

describe('resolveSwipe', () => {
  it('maps the three accepted directions', () => {
    expect(resolveSwipe(-72, 0)).toBe('mastered')
    expect(resolveSwipe(0, -72)).toBe('uncertain')
    expect(resolveSwipe(72, 0)).toBe('incorrect')
  })

  it('ignores short, downward and ambiguous gestures', () => {
    expect(resolveSwipe(-71, 0)).toBeNull()
    expect(resolveSwipe(0, 100)).toBeNull()
    expect(resolveSwipe(50, -50)).toBeNull()
  })
})
