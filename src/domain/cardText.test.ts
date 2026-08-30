import { describe, expect, it } from 'vitest'
import { getCardTextScale } from './cardText'

describe('getCardTextScale', () => {
  it('reduces card text as words and phrases get longer', () => {
    expect(getCardTextScale('CHEAP')).toBe('large')
    expect(getCardTextScale('ADMINISTRATION')).toBe('medium')
    expect(getCardTextScale('ARTÍCULOS DE SEGUNDA')).toBe('small')
    expect(getCardTextScale('Информационно-просветительская работа')).toBe('compact')
  })
})
