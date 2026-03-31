export interface Account {
  id: number
  username: string
  password: string
  enabled: boolean
}

export interface LogEntry {
  time: string
  text: string
}

export interface LoginResult {
  ok: boolean
  reason?: string
  summary?: string
  status?: number
}

export interface SpeedResult {
  ok: boolean
  text: string
}

export interface AppState {
  accounts: Account[]
  logEntries: LogEntry[]
  speedText: string
  loginInProgress: boolean
  addLog: (text: string) => void
  setAccounts: (accounts: Account[]) => void
  setSpeedText: (text: string) => void
  setLoginInProgress: (v: boolean) => void
}
