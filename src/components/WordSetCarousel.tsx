import { useEffect, useRef } from 'react'
import { UI_COPY } from '../domain/i18n'
import type { ActiveSession, LanguageDirection, SetStats, UiLanguage, WordSet } from '../domain/types'
import { getSessionId } from '../domain/session'
import { StatsGrid } from './StatsGrid'

interface WordSetCarouselProps {
  sets: WordSet[]
  selectedSetId: string
  statsBySet: Record<string, SetStats>
  activeSessions: ActiveSession[]
  direction: LanguageDirection
  uiLanguage: UiLanguage
  onSelect: (setId: string) => void
  onContinue: (setId: string) => void
  onRepeat: (setId: string) => void
  onReset: (setId: string) => void
}

export function WordSetCarousel(props: WordSetCarouselProps) {
  const copy = UI_COPY[props.uiLanguage]
  const carouselRef = useRef<HTMLDivElement>(null)
  const scrollTimer = useRef<number | undefined>(undefined)
  const selectedIndex = Math.max(0, props.sets.findIndex((set) => set.id === props.selectedSetId))

  useEffect(() => {
    const carousel = carouselRef.current
    const card = carousel?.children[selectedIndex] as HTMLElement | undefined
    if (carousel && card) carousel.scrollTo({ left: card.offsetLeft - 16, behavior: 'smooth' })
  }, [selectedIndex])

  const handleScroll = () => {
    window.clearTimeout(scrollTimer.current)
    scrollTimer.current = window.setTimeout(() => {
      const carousel = carouselRef.current
      if (!carousel) return
      const center = carousel.scrollLeft + carousel.clientWidth / 2
      let nearestIndex = 0
      let nearestDistance = Number.POSITIVE_INFINITY
      Array.from(carousel.children).forEach((child, index) => {
        const element = child as HTMLElement
        const distance = Math.abs(element.offsetLeft + element.clientWidth / 2 - center)
        if (distance < nearestDistance) {
          nearestIndex = index
          nearestDistance = distance
        }
      })
      const set = props.sets[nearestIndex]
      if (set && set.id !== props.selectedSetId) props.onSelect(set.id)
    }, 100)
  }

  return (
    <section className="sets-section" aria-labelledby="sets-title">
      <div className="sets-section__heading">
        <h2 id="sets-title">{copy.chooseLevel}</h2>
        <span className="sets-section__counter">{selectedIndex + 1} {props.uiLanguage === 'ru' ? 'из' : 'of'} {props.sets.length}</span>
      </div>
      <div className="sets-carousel" ref={carouselRef} onScroll={handleScroll}>
        {props.sets.map((set) => {
          const stats = props.statsBySet[set.id]
          if (!stats) return null
          const continueSessionId = getSessionId({ setId: set.id, mode: 'continue', direction: props.direction })
          const hasActive = props.activeSessions.some((session) => session.id === continueSessionId)
          return (
            <article className="set-card" key={set.id}>
              <div className="set-card__title-row">
                <h3>{props.uiLanguage === 'ru' ? set.title : `Level ${set.order}`}</h3>
                <div className="set-card__learned"><span>{copy.mastered}</span><strong>{stats.mastered}</strong></div>
              </div>
              <StatsGrid stats={stats} uiLanguage={props.uiLanguage} />
              <div className="set-card__actions">
                <button className="button button--primary" type="button" onClick={() => props.onContinue(set.id)} disabled={!hasActive && stats.unseen === 0}>
                  {hasActive ? copy.continueSession : copy.continue}
                </button>
                <button className="button button--secondary" type="button" onClick={() => props.onRepeat(set.id)} disabled={stats.uncertain + stats.incorrect === 0}>
                  {copy.repeat}
                </button>
                <button className="button button--reset" type="button" onClick={() => props.onReset(set.id)} disabled={stats.remaining === set.words.length && stats.uncertain === 0 && stats.incorrect === 0} aria-label={copy.reset} title={copy.reset}>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13M10 11v5m4-5v5" />
                  </svg>
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
