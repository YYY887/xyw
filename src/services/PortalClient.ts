import axios from 'axios'
import { LoginResult, SpeedResult } from '../types'

const PORTAL_BASE = 'http://1.1.1.1:8888'
const PORTAL_PATH = '/webauth.do'

// 固定的 portal 查询参数（除 wlanuserip/mac 外，这些在实际环境中由路由器注入）
const PORTAL_QUERY =
  'wlanacip=1.1.1.1&wlanacname=hnnydxwg&vlan=0&url=http://1.1.1.1'

// 构建 x-www-form-urlencoded body
function buildBody(userId: string, passwd: string): string {
  const params = new URLSearchParams({
    scheme: 'http',
    serverIp: '1.1.1.1:80',
    hostIp: 'http://127.0.0.1:8080/',
    loginType: '',
    auth_type: '0',
    isBindMac1: '0',
    pageid: '-2',
    templatetype: '2',
    listbindmac: '0',
    recordmac: '0',
    isRemind: '1',
    loginTimes: '',
    groupId: '',
    distoken: '',
    echostr: '',
    url: 'http://1.1.1.1',
    isautoauth: '',
    mobile: '',
    userId,
    passwd,
    remInfo: 'on',
  })
  return params.toString()
}

export async function login(username: string, password: string): Promise<LoginResult> {
  const url = `${PORTAL_BASE}${PORTAL_PATH}?${PORTAL_QUERY}`
  try {
    const res = await axios.post(url, buildBody(username, password), {
      timeout: 10000,
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'accept-language': 'zh-CN,zh;q=0.9',
        'cache-control': 'no-cache',
      },
      // http 明文，无需处理 SSL
      maxRedirects: 5,
    })

    const html: string = typeof res.data === 'string' ? res.data : JSON.stringify(res.data)

    // 精确判断：act=LOGINSUCC 且包含 auth_success 标识
    const isSuccess =
      html.includes('value="LOGINSUCC"') ||
      html.includes('id="auth_success"') ||
      html.includes('value="auth_success"')

    if (isSuccess) {
      return { ok: true, summary: '认证成功', status: res.status }
    }

    // 提取错误信息：var s = '错误内容';
    const errMatch = html.match(/var\s+s\s*=\s*'([^']+)'/)
    if (errMatch && errMatch[1]) {
      const errMsg = errMatch[1]
      // 从 span 标签中提取实际错误文字
      const spanMatch = errMsg.match(/<span[^>]*>(.*?)<\/span>/)
      const reason = spanMatch ? spanMatch[1] : errMsg

      if (reason.includes('密码') || reason.includes('password')) {
        return { ok: false, reason: '密码错误', status: res.status }
      }
      if (reason.includes('账号') || reason.includes('用户')) {
        return { ok: false, reason: '账号或密码错误', status: res.status }
      }
      return { ok: false, reason, status: res.status }
    }

    return { ok: false, reason: '认证失败', summary: html.slice(0, 80), status: res.status }
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        return { ok: false, reason: '请求失败', summary: '请求超时' }
      }
      if (!error.response) {
        return { ok: false, reason: '请求失败', summary: '请求超时' }
      }
      return { ok: false, reason: '请求失败', status: error.response.status }
    }
    return { ok: false, reason: '请求失败', summary: error.message }
  }
}

export async function speedTest(): Promise<SpeedResult> {
  // 尝试访问外网检测连通性，能访问说明已认证
  try {
    const res = await axios.get('http://connectivitycheck.platform.hicloud.com/generate_204', {
      timeout: 8000,
      maxRedirects: 0,
      validateStatus: () => true,
    })
    // 204 = 已认证可上网；302/其他 = 被重定向到 portal，说明未认证或掉线
    if (res.status === 204) {
      return { ok: true, text: '链路已建立' }
    }
    // 被重定向到 portal，触发重连
    return { ok: false, text: `HTTP ${res.status}` }
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response) {
      return { ok: false, text: `HTTP ${error.response.status}` }
    }
    return { ok: false, text: '连接超时' }
  }
}
