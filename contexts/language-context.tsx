'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { th, Dictionary } from '@/lib/i18n/th'
import { en } from '@/lib/i18n/en'

type Language = 'th' | 'en'

interface LanguageContextType {
  lang: Language
  setLang: (lang: Language) => void
  t: (key: string, params?: Record<string, any>) => string
  dictionary: Dictionary
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('th')

  useEffect(() => {
    const saved = localStorage.getItem('mudmy-lang') as Language
    if (saved && (saved === 'th' || saved === 'en')) {
      setLangState(saved)
      document.documentElement.lang = saved
    }
  }, [])

  const setLang = (newLang: Language) => {
    setLangState(newLang)
    localStorage.setItem('mudmy-lang', newLang)
    document.documentElement.lang = newLang
  }

  const dictionary = lang === 'en' ? en : th

  useEffect(() => {
    // Update document title and lang attribute
    const keys = ['metadata', 'title']
    let current: any = dictionary
    let title = 'Mudmy'
    
    try {
      for (const key of keys) {
        current = current[key]
      }
      title = current as string
    } catch (e) {
      console.error('Failed to get metadata title', e)
    }

    document.title = title
    document.documentElement.lang = lang

    // Update meta description
    const metaDesc = document.querySelector('meta[name="description"]')
    if (metaDesc) {
      let desc = ''
      try {
        desc = dictionary.metadata.description
        metaDesc.setAttribute('content', desc)
      } catch (_e) {}
    }
  }, [lang, dictionary])

  const t = (path: string, params?: Record<string, any>) => {
    const keys = path.split('.')
    let current: any = dictionary
    
    for (const key of keys) {
      if (current[key] === undefined) {
        console.warn(`Translation key not found: ${path}`)
        return path
      }
      current = current[key]
    }

    let result = current as string
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        result = result.replace(`{${key}}`, String(value))
      })
    }
    return result
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, dictionary }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
