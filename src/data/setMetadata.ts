export const SET_METADATA = Array.from({ length: 10 }, (_, index) => ({
  id: `set-${String(index + 1).padStart(2, '0')}`,
  sheetName: `${ordinal(index + 1)}-thousand`,
  title: `Уровень ${index + 1}`,
  order: index + 1,
}))

function ordinal(value: number): string {
  const names = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth']
  return names[value - 1]
}
