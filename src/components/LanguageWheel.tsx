import { useEffect, useRef } from 'react'
import { LANGUAGES, LANGUAGE_LABELS_BY_UI, type Language, type UiLanguage } from '../domain/types'

interface LanguageWheelProps {
  label: string
  value: Language
  options?: Language[]
  uiLanguage: UiLanguage
  onChange: (value: Language) => void
}

function getOptionHeight(list: HTMLDivElement) {
  return list.querySelector<HTMLButtonElement>('.language-wheel__option')?.offsetHeight || 44
}

export function LanguageWheel({ label, value, options = LANGUAGES, uiLanguage, onChange }: LanguageWheelProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const scrollTimer = useRef<number | undefined>(undefined)

  useEffect(() => {
    const index = options.indexOf(value)
    const list = listRef.current
    if (list && index >= 0) list.scrollTo({ top: index * getOptionHeight(list), behavior: 'auto' })
  }, [options, value])

  useEffect(() => () => window.clearTimeout(scrollTimer.current), [])

  const handleScroll = () => {
    window.clearTimeout(scrollTimer.current)
    scrollTimer.current = window.setTimeout(() => {
      const list = listRef.current
      if (!list) return
      const optionHeight = getOptionHeight(list)
      const index = Math.max(0, Math.min(options.length - 1, Math.round(list.scrollTop / optionHeight)))
      const next = options[index]
      list.scrollTo({ top: index * optionHeight, behavior: 'auto' })
      if (next !== value) onChange(next)
    }, 90)
  }

  return (
    <div className="language-wheel">
      <span className="language-wheel__label">{label}</span>
      <div className="language-wheel__viewport">
        <div className="language-wheel__frame" aria-hidden="true" />
        <div className="language-wheel__list" ref={listRef} onScroll={handleScroll}>
          {options.map((language) => (
            <button
              className={`language-wheel__option ${language === value ? 'is-selected' : ''}`}
              key={language}
              type="button"
              onClick={() => onChange(language)}
              aria-pressed={language === value}
            >
              {LANGUAGE_LABELS_BY_UI[uiLanguage][language]}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
