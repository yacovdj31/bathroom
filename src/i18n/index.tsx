/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { en } from './en'
import { he } from './he'

type Language = 'en' | 'he'
type Strings = typeof en

type I18nContextValue = {
  language: Language
  strings: Strings
  setLanguage: (next: Language) => void
  isRTL: boolean
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined)

const STORAGE_KEY = 'jewhaven_language'

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window === 'undefined') return 'en'
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored === 'he' ? 'he' : 'en'
  })

  useEffect(() => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    root.lang = language
    root.dir = 'ltr'
    window.localStorage.setItem(STORAGE_KEY, language)
  }, [language])

  const value = useMemo<I18nContextValue>(() => {
    const strings = (language === 'he' ? he : en) as Strings
    return { language, strings, setLanguage, isRTL: false }
  }, [language])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within a LanguageProvider')
  }
  return context
}
