import React, { createContext, useContext, useState } from 'react'
import { LogEntry } from '../types'

interface LogContextValue {
  logEntries: LogEntry[]
  addLog: (text: string) => void
}

export const LogContext = createContext<LogContextValue>({
  logEntries: [],
  addLog: () => {},
})

export function LogProvider({ children }: { children: React.ReactNode }) {
  const [logEntries, setLogEntries] = useState<LogEntry[]>([])

  const addLog = (text: string) => {
    const time = new Date().toLocaleTimeString([], {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    setLogEntries((prev) => {
      const next = [...prev, { time, text }]
      return next.length > 200 ? next.slice(next.length - 200) : next
    })
  }

  return (
    <LogContext.Provider value={{ logEntries, addLog }}>
      {children}
    </LogContext.Provider>
  )
}

export function useLog() {
  return useContext(LogContext)
}
