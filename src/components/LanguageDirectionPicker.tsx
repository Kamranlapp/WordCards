import { UI_COPY } from '../domain/i18n'
import { LANGUAGES, type Language, type LanguageDirection, type UiLanguage } from '../domain/types'
import { LanguageWheel } from './LanguageWheel'

interface LanguageDirectionPickerProps {
  value: LanguageDirection
  uiLanguage: UiLanguage
  onChange: (value: LanguageDirection) => void
}

export function LanguageDirectionPicker({ value, uiLanguage, onChange }: LanguageDirectionPickerProps) {
  const copy = UI_COPY[uiLanguage]
  const targetLanguages = LANGUAGES.filter((language) => language !== value.from)
  const changeFrom = (language: Language) => {
    onChange(language === value.to ? { from: language, to: value.from } : { ...value, from: language })
  }
  const changeTo = (language: Language) => {
    onChange(language === value.from ? { from: value.to, to: language } : { ...value, to: language })
  }

  return (
    <section className="direction-picker" aria-label={`${copy.fromLanguage} / ${copy.toLanguage}`}>
      <LanguageWheel label={copy.fromLanguage} value={value.from} uiLanguage={uiLanguage} onChange={changeFrom} />
      <span className="direction-picker__arrow" aria-hidden="true">→</span>
      <LanguageWheel label={copy.toLanguage} value={value.to} options={targetLanguages} uiLanguage={uiLanguage} onChange={changeTo} />
    </section>
  )
}
