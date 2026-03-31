import { login, speedTest } from './PortalClient'
import { send } from './NotificationService'
import { Account } from '../types'

export interface SpeedMonitorCallbacks {
  onSpeedResult: (text: string) => void
  onLog: (text: string) => void
  getEnabledAccounts: () => Promise<Account[]>
  onLoginSuccess: () => void
}

class SpeedMonitor {
  private intervalId: ReturnType<typeof setInterval> | null = null
  private lastAutoReloginAt: number = 0

  start(callbacks: SpeedMonitorCallbacks): void {
    this.runOnce(callbacks)
    this.intervalId = setInterval(() => {
      this.runOnce(callbacks)
    }, 12000)
  }

  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  async runOnce(
    callbacks: SpeedMonitorCallbacks,
    options?: { silent?: boolean }
  ): Promise<void> {
    try {
      const result = await speedTest()
      callbacks.onSpeedResult(result.text)
      if (!result.ok) {
        await this.autoRelogin(callbacks)
      }
    } catch (error: any) {
      callbacks.onSpeedResult('连接超时')
      if (!options?.silent) {
        callbacks.onLog(`测速异常: ${error?.message ?? error}`)
      }
    }
  }

  private async autoRelogin(callbacks: SpeedMonitorCallbacks): Promise<void> {
    const now = Date.now()
    if (now - this.lastAutoReloginAt < 15000) {
      return
    }
    this.lastAutoReloginAt = now

    callbacks.onLog('检测到链路 502，开始自动重新认证')

    const accounts = await callbacks.getEnabledAccounts()
    // 随机打乱账号顺序
    const shuffled = [...accounts].sort(() => Math.random() - 0.5)

    for (const account of shuffled) {
      const result = await login(account.username, account.password)
      if (result.ok) {
        callbacks.onLog('自动重连成功: ' + account.username)
        await send('认证成功', '网络已重新认证成功', callbacks.onLog)
        callbacks.onLoginSuccess()
        return
      }
    }
  }
}

export default new SpeedMonitor()
