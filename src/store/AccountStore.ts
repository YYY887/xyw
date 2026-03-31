import AsyncStorage from '@react-native-async-storage/async-storage'
import { Account } from '../types'

const STORAGE_KEY = '@wifi_assistant:accounts'

class AccountStore {
  async load(): Promise<Account[]> {
    const json = await AsyncStorage.getItem(STORAGE_KEY)
    if (!json) return []
    return this.deserialize(json)
  }

  async save(accounts: Account[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEY, this.serialize(accounts))
  }

  async getEnabledAccounts(): Promise<Account[]> {
    const accounts = await this.load()
    return accounts.filter((a) => a.enabled === true)
  }

  parseBulkText(text: string): Account[] {
    const lines = text.split('\n')
    const result: Account[] = []
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue
      // 按逗号或空白分割，取前两段
      const parts = trimmed.split(/[,\s]+/)
      if (parts.length < 2 || !parts[0] || !parts[1]) continue
      const id = Date.now() * 1000 + Math.floor(Math.random() * 1000)
      result.push({
        id,
        username: parts[0],
        password: parts[1],
        enabled: true,
      })
    }
    return result
  }

  serialize(accounts: Account[]): string {
    return JSON.stringify(accounts)
  }

  deserialize(json: string): Account[] {
    try {
      return JSON.parse(json) as Account[]
    } catch {
      return []
    }
  }
}

export default new AccountStore()
