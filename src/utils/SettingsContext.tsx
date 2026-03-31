import React, { createContext, useContext, useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

export interface Theme {
  bg: string
  card: string
  cardBorder: string
  text: string
  subText: string
  border: string
  input: string
  overlay: string
  navBg: string
  logRow: string
}

const dark: Theme = {
  bg: '#1b1b1d',
  card: '#1c1c1e',
  cardBorder: 'rgba(255,255,255,0.06)',
  text: '#fff',
  subText: '#8e8e93',
  border: 'rgba(255,255,255,0.06)',
  input: '#2a2a2a',
  overlay: 'rgba(0,0,0,0.55)',
  navBg: 'rgba(10,10,10,0.95)',
  logRow: 'rgba(255,255,255,0.05)',
}

const light: Theme = {
  bg: '#f2f2f7',
  card: '#fff',
  cardBorder: 'rgba(0,0,0,0.06)',
  text: '#000',
  subText: '#6c6c70',
  border: 'rgba(0,0,0,0.08)',
  input: '#f2f2f7',
  overlay: 'transparent',
  navBg: 'rgba(248,248,248,0.97)',
  logRow: 'rgba(0,0,0,0.04)',
}

interface SettingsContextValue {
  bgImage: string | null
  isDark: boolean
  autoCheck: boolean
  theme: Theme
  setBgImage: (uri: string | null) => Promise<void>
  toggleTheme: () => Promise<void>
  toggleAutoCheck: () => Promise<void>
}

const SettingsContext = createContext<SettingsContextValue>({
  bgImage: null,
  isDark: true,
  autoCheck: true,
  theme: dark,
  setBgImage: async () => {},
  toggleTheme: async () => {},
  toggleAutoCheck: async () => {},
})

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [bgImage, setBgImageState] = useState<string | null>(null)
  const [isDark, setIsDark] = useState(true)
  const [autoCheck, setAutoCheck] = useState(true)

  useEffect(() => {
    AsyncStorage.multiGet(['@wifi_assistant:bg_image', '@wifi_assistant:theme', '@wifi_assistant:auto_check']).then(pairs => {
      if (pairs[0][1]) setBgImageState(pairs[0][1])
      if (pairs[1][1] === 'light') setIsDark(false)
      if (pairs[2][1] === 'false') setAutoCheck(false)
    })
  }, [])

  const setBgImage = async (uri: string | null) => {
    setBgImageState(uri)
    if (uri) await AsyncStorage.setItem('@wifi_assistant:bg_image', uri)
    else await AsyncStorage.removeItem('@wifi_assistant:bg_image')
  }

  const toggleTheme = async () => {
    const next = !isDark
    setIsDark(next)
    await AsyncStorage.setItem('@wifi_assistant:theme', next ? 'dark' : 'light')
  }

  const toggleAutoCheck = async () => {
    const next = !autoCheck
    setAutoCheck(next)
    await AsyncStorage.setItem('@wifi_assistant:auto_check', next ? 'true' : 'false')
  }

  return (
    <SettingsContext.Provider value={{ bgImage, isDark, autoCheck, theme: isDark ? dark : light, setBgImage, toggleTheme, toggleAutoCheck }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  return useContext(SettingsContext)
}
