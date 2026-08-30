import { SET_METADATA } from './setMetadata'
import type { Word } from '../domain/types'
import type { WordRepository } from './wordRepository'

async function loadWords(setId: string): Promise<Word[]> {
  const response = await fetch(`/data/sets/${setId}.json`)
  if (!response.ok) throw new Error(`Не удалось загрузить комплект ${setId}`)
  return response.json() as Promise<Word[]>
}

export const sheetSnapshotRepository: WordRepository = {
  async listSets() {
    return Promise.all(
      SET_METADATA.map(async (metadata) => ({
        ...metadata,
        words: await loadWords(metadata.id),
      })),
    )
  },
  async getSet(setId) {
    const metadata = SET_METADATA.find((item) => item.id === setId)
    if (!metadata) return null
    return { ...metadata, words: await loadWords(setId) }
  },
}
