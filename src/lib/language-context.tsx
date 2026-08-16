'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { translations, type Language, type TranslationKey } from '@/lib/i18n'

interface LanguageContextType {
  lang: Language
  toggleLang: () => void
  t: (key: TranslationKey) => string
  dir: 'ltr' | 'rtl'
}

const LanguageContext = createContext<LanguageContextType | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>('en')

  const toggleLang = useCallback(() => {
    setLang((prev) => (prev === 'en' ? 'ar' : 'en'))
  }, [])

  const t = useCallback(
    (key: TranslationKey): string => {
      const section = translations[lang]
      const keys = key.split('.')
      let result: unknown = section
      for (const k of keys) {
        if (result && typeof result === 'object' && k in result) {
          result = (result as Record<string, unknown>)[k]
        } else {
          return key
        }
      }
      return typeof result === 'string' ? result : key
    },
    [lang]
  )

  const dir = lang === 'ar' ? 'rtl' : 'ltr'

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t, dir }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLang() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLang must be used within LanguageProvider')
  return ctx
}
