import type { WordSet } from '../domain/types'

export interface WordRepository {
  listSets(): Promise<WordSet[]>
  getSet(setId: string): Promise<WordSet | null>
}
