import { useRef, useState } from 'react'
import { motion, useAnimation, type PanInfo } from 'motion/react'
import { UI_COPY } from '../domain/i18n'
import { LANGUAGE_LABELS_BY_UI, type LanguageDirection, type UiLanguage, type Word, type WordStatus } from '../domain/types'
import { isTapGesture, resolveSwipe } from '../domain/gesture'
import { getCardTextScale } from '../domain/cardText'

interface FlipCardProps {
  word: Word
  direction: LanguageDirection
  uiLanguage: UiLanguage
  onAnswer: (status: Exclude<WordStatus, 'unseen'>) => Promise<void>
}

export function FlipCard({ word, direction, uiLanguage, onAnswer }: FlipCardProps) {
  const copy = UI_COPY[uiLanguage]
  const [revealed, setRevealed] = useState(false)
  const [hasRevealed, setHasRevealed] = useState(false)
  const [hint, setHint] = useState<'mastered' | 'uncertain' | 'incorrect' | null>(null)
  const [answering, setAnswering] = useState(false)
  const pointerStart = useRef<{ x: number; y: number } | null>(null)
  const controls = useAnimation()

  const dragEnd = async (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!hasRevealed || answering) return
    const result = resolveSwipe(info.offset.x, info.offset.y)
    if (!result) {
      setHint(null)
      await controls.start({ x: 0, y: 0, rotate: 0, transition: { type: 'spring', stiffness: 420, damping: 30 } })
      return
    }
    setAnswering(true)
    const exit = result === 'mastered' ? { x: -520, y: 0, rotate: -10 } : result === 'incorrect' ? { x: 520, y: 0, rotate: 10 } : { x: 0, y: -700, rotate: 0 }
    await controls.start({ ...exit, opacity: 0, transition: { duration: 0.2, ease: 'easeOut' } })
    await onAnswer(result)
  }

  const dragMove = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!hasRevealed) return
    setHint(resolveSwipe(info.offset.x, info.offset.y))
  }

  const toggleCard = () => {
    if (answering) return
    setHint(null)
    if (!revealed) setHasRevealed(true)
    setRevealed((current) => !current)
  }

  return (
    <div className={`study-card-stage hint-${hint ?? 'none'}`}>
      <div className="swipe-label swipe-label--left">{copy.knowExactly}</div>
      <div className="swipe-label swipe-label--up">{copy.difficultShort}</div>
      <div className="swipe-label swipe-label--right">{copy.mistakeShort}</div>
      <motion.div
        className="study-card-dragger"
        drag={hasRevealed && !answering}
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.92}
        animate={controls}
        onDrag={dragMove}
        onDragEnd={dragEnd}
        onPointerDown={(event) => { pointerStart.current = { x: event.clientX, y: event.clientY } }}
        onPointerUp={(event) => {
          const start = pointerStart.current
          pointerStart.current = null
          if (start && isTapGesture(event.clientX - start.x, event.clientY - start.y)) toggleCard()
        }}
        onPointerCancel={() => { pointerStart.current = null }}
      >
        <div className={`study-card ${revealed ? 'is-revealed' : ''}`}>
          <div className="study-card__face study-card__front">
            <span className="study-card__language">{LANGUAGE_LABELS_BY_UI[uiLanguage][direction.from]}</span>
            <strong data-scale={getCardTextScale(word.translations[direction.from])}>{word.translations[direction.from]}</strong>
            <span className="study-card__instruction">{copy.tapToReveal}</span>
          </div>
          <div className="study-card__face study-card__back">
            <span className="study-card__language">{LANGUAGE_LABELS_BY_UI[uiLanguage][direction.to]}</span>
            <strong data-scale={getCardTextScale(word.translations[direction.to])}>{word.translations[direction.to]}</strong>
            <div className="gesture-legend"><span>{copy.knowGesture}</span><span>{copy.difficultGesture}</span><span>{copy.mistakeGesture}</span></div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
