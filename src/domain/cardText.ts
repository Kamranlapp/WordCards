export type CardTextScale = 'large' | 'medium' | 'small' | 'compact'

export function getCardTextScale(text: string): CardTextScale {
  const length = Array.from(text.trim()).length
  if (length <= 10) return 'large'
  if (length <= 16) return 'medium'
  if (length <= 26) return 'small'
  return 'compact'
}
