'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { updateUserProfile } from '@/lib/services/users'

export type ThemeColorId =
  | 'orange'
  | 'rose'
  | 'sky'
  | 'mint'
  | 'lavender'
  | 'peach'
  | 'butter'
  | 'lilac'

export interface ThemeColor {
  id: ThemeColorId
  label: string
  swatch: string
  primary: string
  secondary: string
  ring: string
  primaryDark: string
  secondaryDark: string
  ringDark: string
}

export const THEME_COLORS: ThemeColor[] = [
  {
    id: 'orange',
    label: 'ส้มอ่อน (ค่าเริ่มต้น)',
    swatch: '#FFBF8C',
    primary: 'oklch(0.72 0.21 45)',
    secondary: 'oklch(0.65 0.22 35)',
    ring: 'oklch(0.72 0.21 45)',
    primaryDark: 'oklch(0.68 0.21 45)',
    secondaryDark: 'oklch(0.60 0.22 35)',
    ringDark: 'oklch(0.68 0.21 45)',
  },
  {
    id: 'rose',
    label: 'กุหลาบพาสเทล',
    swatch: '#FFB3C1',
    primary: 'oklch(0.74 0.16 5)',
    secondary: 'oklch(0.68 0.18 355)',
    ring: 'oklch(0.74 0.16 5)',
    primaryDark: 'oklch(0.70 0.16 5)',
    secondaryDark: 'oklch(0.64 0.18 355)',
    ringDark: 'oklch(0.70 0.16 5)',
  },
  {
    id: 'sky',
    label: 'ฟ้าอ่อน',
    swatch: '#BAE6FD',
    primary: 'oklch(0.72 0.14 220)',
    secondary: 'oklch(0.65 0.16 210)',
    ring: 'oklch(0.72 0.14 220)',
    primaryDark: 'oklch(0.68 0.14 220)',
    secondaryDark: 'oklch(0.62 0.16 210)',
    ringDark: 'oklch(0.68 0.14 220)',
  },
  {
    id: 'mint',
    label: 'มิ้นต์สด',
    swatch: '#A7F3D0',
    primary: 'oklch(0.75 0.13 165)',
    secondary: 'oklch(0.68 0.15 155)',
    ring: 'oklch(0.75 0.13 165)',
    primaryDark: 'oklch(0.70 0.13 165)',
    secondaryDark: 'oklch(0.64 0.15 155)',
    ringDark: 'oklch(0.70 0.13 165)',
  },
  {
    id: 'lavender',
    label: 'ลาเวนเดอร์',
    swatch: '#C4B5FD',
    primary: 'oklch(0.72 0.16 288)',
    secondary: 'oklch(0.66 0.18 278)',
    ring: 'oklch(0.72 0.16 288)',
    primaryDark: 'oklch(0.68 0.16 288)',
    secondaryDark: 'oklch(0.62 0.18 278)',
    ringDark: 'oklch(0.68 0.16 288)',
  },
  {
    id: 'peach',
    label: 'พีชนุ่ม',
    swatch: '#FECBA1',
    primary: 'oklch(0.78 0.13 60)',
    secondary: 'oklch(0.72 0.15 50)',
    ring: 'oklch(0.78 0.13 60)',
    primaryDark: 'oklch(0.74 0.13 60)',
    secondaryDark: 'oklch(0.68 0.15 50)',
    ringDark: 'oklch(0.74 0.13 60)',
  },
  {
    id: 'butter',
    label: 'เหลืองเนย',
    swatch: '#FEF08A',
    primary: 'oklch(0.82 0.14 95)',
    secondary: 'oklch(0.76 0.16 85)',
    ring: 'oklch(0.82 0.14 95)',
    primaryDark: 'oklch(0.78 0.14 95)',
    secondaryDark: 'oklch(0.72 0.16 85)',
    ringDark: 'oklch(0.78 0.14 95)',
  },
  {
    id: 'lilac',
    label: 'ม่วงไลแลค',
    swatch: '#F5C2E7',
    primary: 'oklch(0.74 0.15 330)',
    secondary: 'oklch(0.68 0.17 320)',
    ring: 'oklch(0.74 0.15 330)',
    primaryDark: 'oklch(0.70 0.15 330)',
    secondaryDark: 'oklch(0.64 0.17 320)',
    ringDark: 'oklch(0.70 0.15 330)',
  },
]

const STORAGE_KEY = 'mudmy_theme_color'

interface ThemeColorContextType {
  activeTheme: ThemeColor
  setThemeColor: (id: ThemeColorId) => void
  themes: ThemeColor[]
}

const ThemeColorContext = createContext<ThemeColorContextType | undefined>(undefined)

export function useThemeColor() {
  const ctx = useContext(ThemeColorContext)
  if (!ctx) throw new Error('useThemeColor must be used within ThemeColorProvider')
  return ctx
}

function isThemeId(id: string | null | undefined): id is ThemeColorId {
  return !!id && THEME_COLORS.some((t) => t.id === id)
}

function applyTheme(theme: ThemeColor, isDark: boolean) {
  const root = document.documentElement
  root.style.setProperty('--primary', isDark ? theme.primaryDark : theme.primary)
  root.style.setProperty('--secondary', isDark ? theme.secondaryDark : theme.secondary)
  root.style.setProperty('--ring', isDark ? theme.ringDark : theme.ring)
  // Keep some legacy tokens in sync so older CSS using them updates too
  root.style.setProperty('--royal-blue', isDark ? (theme.primaryDark) : (theme.primary))
  root.style.setProperty('--royal-gold', isDark ? (theme.secondaryDark) : (theme.secondary))
  // marker color used by map pins and some components (fallback exists in CSS)
  root.style.setProperty('--marker-color', theme.swatch)
}

export function ThemeColorProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [activeId, setActiveId] = useState<ThemeColorId>('orange')

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (isThemeId(stored)) setActiveId(stored)
  }, [])

  useEffect(() => {
    if (!user?.id) return
    const stored = localStorage.getItem(STORAGE_KEY)
    if (isThemeId(stored)) {
      setActiveId(stored)
      if (user.themeColor !== stored) {
        updateUserProfile(user.id, { themeColor: stored }).catch(() => {})
      }
      return
    }
    if (isThemeId(user.themeColor)) {
      setActiveId(user.themeColor)
      localStorage.setItem(STORAGE_KEY, user.themeColor)
    }
  }, [user?.id, user?.themeColor])

  useEffect(() => {
    const theme = THEME_COLORS.find(t => t.id === activeId) ?? THEME_COLORS[0]
    const isDark = document.documentElement.classList.contains('dark')
    applyTheme(theme, isDark)

    const observer = new MutationObserver(() => {
      const dark = document.documentElement.classList.contains('dark')
      applyTheme(theme, dark)
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [activeId])

  const setThemeColor = (id: ThemeColorId) => {
    setActiveId(id)
    localStorage.setItem(STORAGE_KEY, id)
    if (user?.id) {
      updateUserProfile(user.id, { themeColor: id }).catch(() => {})
    }
  }

  const activeTheme = THEME_COLORS.find(t => t.id === activeId) ?? THEME_COLORS[0]

  return (
    <ThemeColorContext.Provider value={{ activeTheme, setThemeColor, themes: THEME_COLORS }}>
      {children}
    </ThemeColorContext.Provider>
  )
}
