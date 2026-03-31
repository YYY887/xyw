import React, { createContext, useContext, useEffect, useState } from 'react'
import { Account } from '../types'
import AccountStore from '../store/AccountStore'

interface AccountContextValue {
  accounts: Account[]
  setAccounts: (accounts: Account[]) => void
  saveAccounts: (accounts: Account[]) => Promise<void>
  reload: () => Promise<void>
}

const AccountContext = createContext<AccountContextValue>({
  accounts: [],
  setAccounts: () => {},
  saveAccounts: async () => {},
  reload: async () => {},
})

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [accounts, setAccountsState] = useState<Account[]>([])

  const reload = async () => {
    const loaded = await AccountStore.load()
    setAccountsState(loaded)
  }

  const saveAccounts = async (updated: Account[]) => {
    setAccountsState(updated)
    await AccountStore.save(updated)
  }

  useEffect(() => {
    reload()
  }, [])

  return (
    <AccountContext.Provider value={{ accounts, setAccounts: setAccountsState, saveAccounts, reload }}>
      {children}
    </AccountContext.Provider>
  )
}

export function useAccounts() {
  return useContext(AccountContext)
}
