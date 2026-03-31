import React, { useEffect, useRef, useState } from 'react'
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as Network from 'expo-network'
import { useNavigation } from '@react-navigation/native'
import { useLog } from '../utils/LogConsole'
import { useAccounts } from '../utils/AccountContext'
import { useSettings } from '../utils/SettingsContext'
import { login } from '../services/PortalClient'
import SpeedMonitor from '../services/SpeedMonitor'
import { Account } from '../types'

const { width, height } = Dimensions.get('window')
const BTN_SIZE = width * 0.38
const RING_SIZE = BTN_SIZE + 22
const GLOW_SIZE = BTN_SIZE + 56

interface LogItem {
  text: string
  count: number
  status: 'pending' | 'success' | 'error' | 'doing'
}

export default function HomeScreen() {
  const navigation = useNavigation<any>()
  const { addLog } = useLog()
  const { accounts, saveAccounts } = useAccounts()
  const { bgImage, theme, isDark, autoCheck } = useSettings()

  const [speedText, setSpeedText] = useState('正在扫描...')
  const [loginInProgress, setLoginInProgress] = useState(false)
  const [connected, setConnected] = useState(false)
  const [wifiName, setWifiName] = useState('获取中...')
  const [logs, setLogs] = useState<LogItem[]>([])

  const clickCountRef = useRef(0)
  const lastClickTimeRef = useRef(0)
  const accountsRef = useRef<Account[]>([])
  const pulseAnim = useRef(new Animated.Value(1)).current
  const rippleAnim = useRef(new Animated.Value(0)).current

  const addLogItem = (text: string, status: LogItem['status'] = 'doing') => {
    setLogs(prev => {
      const existing = prev.find(item => item.text === text)
      if (existing) {
        return prev.map(item => item.text === text ? { ...item, count: item.count + 1 } : item)
      }
      return [...prev.slice(-4), { text, count: 1, status }]
    })
  }

  const updateLogStatus = (text: string, status: LogItem['status']) => {
    setLogs(prev => prev.map(item => item.text === text ? { ...item, status } : item))
  }

  useEffect(() => { accountsRef.current = accounts }, [accounts])

  useEffect(() => {
    const fetchNet = async () => {
      try {
        const state = await Network.getNetworkStateAsync()
        if (state.type === Network.NetworkStateType.WIFI) setWifiName('WiFi 已连接')
        else if (state.type === Network.NetworkStateType.CELLULAR) setWifiName('移动数据')
        else setWifiName('无网络')
      } catch { setWifiName('未知网络') }
    }
    fetchNet()
    const t = setInterval(fetchNet, 10000)
    return () => clearInterval(t)
  }, [])



  useEffect(() => {
    // 波纹扩散收缩动画
    const ripple = Animated.loop(
      Animated.sequence([
        Animated.timing(rippleAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(rippleAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    )
    ripple.start()

    addLogItem('系统就绪', 'success')
    
    if (autoCheck) {
      SpeedMonitor.start({
        onSpeedResult: (text) => { 
          setSpeedText(text)
          if (text === '链路已建立') {
            setConnected(true)
            addLogItem('网络已连接', 'success')
          }
        },
        onLog: (msg: string) => {
          if (msg.includes('自动重连成功')) {
            addLogItem('自动重连', 'success')
          }
        },
        getEnabledAccounts: () => Promise.resolve(accountsRef.current.filter(a => a.enabled)),
        onLoginSuccess: () => { 
          setConnected(true)
          addLogItem('认证成功', 'success')
        },
      })
    }
    return () => { ripple.stop(); SpeedMonitor.stop() }
  }, [autoCheck])

  const handlePress = async () => {
    const now = Date.now()
    if (now - lastClickTimeRef.current <= 1000) clickCountRef.current += 1
    else clickCountRef.current = 1
    lastClickTimeRef.current = now

    if (clickCountRef.current >= 5) {
      clickCountRef.current = 0
      navigation.navigate('Manage')
      return
    }
    if (loginInProgress) return

    const current = accountsRef.current
    if (!current.length) {
      Alert.alert('提示', '账号池为空，请先添加账号', [
        { text: '去添加', onPress: () => navigation.navigate('Manage') },
        { text: '取消' },
      ])
      return
    }
    const enabled = current.filter(a => a.enabled)
    if (!enabled.length) { Alert.alert('提示', '没有可用账号'); return }

    setLoginInProgress(true)
    addLogItem('开始认证', 'doing')

    const shuffled = [...enabled].sort(() => Math.random() - 0.5)
    let timeouts = 0

    for (const account of shuffled) {
      const result = await login(account.username, account.password)
      if (result.ok) {
        addLogItem('认证成功', 'success')
        setLoginInProgress(false)
        setConnected(true)
        return
      }
      const reason = result.reason ?? ''
      const summary = result.summary ?? ''
      if (reason === '密码错误' || reason === '账号或密码错误') {
        addLogItem('密码错误', 'error')
        await saveAccounts(accountsRef.current.filter(a => a.id !== account.id))
        continue
      }
      if (summary.includes('请求超时')) {
        if (++timeouts >= 5) { 
          setLoginInProgress(false)
          addLogItem('连续超时', 'error')
          Alert.alert('提示', '连续超时，已停止')
          return 
        }
        continue
      }
      timeouts = 0
      addLogItem('认证失败', 'error')
    }
    setLoginInProgress(false)
    addLogItem('认证结束', 'error')
  }

  const btnColor = connected ? '#30d158' : loginInProgress ? '#ffb340' : '#0a84ff'
  const glowColor = connected ? 'rgba(48,209,88,0.4)' : loginInProgress ? 'rgba(255,179,64,0.4)' : 'rgba(10,132,255,0.4)'

  const getStatusColor = (status: LogItem['status']) => {
    switch (status) {
      case 'success': return '#34c759'
      case 'error': return '#ff3b30'
      case 'doing': return '#0071e3'
      default: return theme.subText
    }
  }

  const getStatusIcon = (status: LogItem['status']) => {
    switch (status) {
      case 'success': return 'checkmark-circle'
      case 'error': return 'close-circle'
      case 'doing': return 'time'
      default: return 'ellipse'
    }
  }

  const content = (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* 顶部品牌栏 */}
        <View style={[styles.brandCard, {
          backgroundColor: isDark ? 'rgba(28,28,30,0.85)' : 'rgba(255,255,255,0.9)',
          borderColor: theme.cardBorder,
        }]}>
          <View style={styles.brandLeft}>
            <Image source={require('../../assets/icon.jpg')} style={styles.logo} />
            <View style={{ marginLeft: 10 }}>
              <Text style={[styles.appName, { color: theme.text }]}>千秋 WIFI</Text>
              <Text style={[styles.wifiNameText, { color: theme.subText }]}>{wifiName}</Text>
            </View>
          </View>
          <View style={styles.brandRight}>
            <View style={[styles.statusBadge, {
              backgroundColor: connected ? 'rgba(52,199,89,0.15)' : 'rgba(255,159,10,0.12)',
            }]}>
              <View style={[styles.statusDot, { backgroundColor: connected ? '#34c759' : '#ff9f0a' }]} />
              <Text style={[styles.statusBadgeText, { color: connected ? '#34c759' : '#ff9f0a' }]}>
                {loginInProgress ? '认证中' : connected ? '已认证' : '未认证'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Manage')} style={styles.manageBtn} activeOpacity={0.7}>
              <Ionicons name="people" size={22} color={theme.subText} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 核心按钮区 */}
        <View style={styles.btnArea}>
          <Animated.View style={[styles.ripple, {
            backgroundColor: connected ? '#34c759' : loginInProgress ? '#ff9f0a' : '#ff3b30',
            opacity: rippleAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0] }),
            transform: [{ scale: rippleAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] }) }]
          }]} />
          <TouchableOpacity
            style={[styles.mainBtn, { backgroundColor: connected ? '#34c759' : loginInProgress ? '#ff9f0a' : '#ff3b30' }]}
            onPress={handlePress}
            disabled={loginInProgress}
            activeOpacity={0.8}
          >
            <Ionicons name="wifi" size={44} color="#fff" />
          </TouchableOpacity>
        </View>

        <Text style={[styles.statusMain, { color: theme.text }]}>
          {loginInProgress ? '正在认证...' : speedText}
        </Text>
        <Text style={[styles.statusHint, { color: theme.subText }]}>
          {loginInProgress ? '请稍候' : connected ? '点击重新认证' : '点击开始认证'}
        </Text>

        {/* 流程日志 */}
        <View style={[styles.logCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Text style={[styles.logTitle, { color: theme.subText }]}>连接流程</Text>
          {logs.length === 0 ? (
            <Text style={[styles.logEmpty, { color: theme.subText }]}>等待连接...</Text>
          ) : (
            logs.map((item, i) => (
              <View key={i} style={styles.logItem}>
                <View style={styles.logLeft}>
                  <Ionicons name={getStatusIcon(item.status)} size={18} color={getStatusColor(item.status)} />
                  <Text style={[styles.logText, { color: theme.text }]}>{item.text}</Text>
                  {item.count > 1 && (
                    <View style={[styles.countBadge, { backgroundColor: getStatusColor(item.status) }]}>
                      <Text style={styles.countText}>x{item.count}</Text>
                    </View>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.subText} />
              </View>
            ))
          )}
        </View>

        <View style={{ height: height * 0.08 }} />
      </ScrollView>
    </SafeAreaView>
  )

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      {bgImage ? (
        <ImageBackground source={{ uri: bgImage }} style={{ flex: 1 }}>
          <View style={{ flex: 1, backgroundColor: theme.overlay }}>{content}</View>
        </ImageBackground>
      ) : content}
    </View>
  )
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 20 },

  brandCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 12,
    marginBottom: 28, borderWidth: 1,
  },
  brandLeft: { flexDirection: 'row', alignItems: 'center' },
  brandRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 38, height: 38, borderRadius: 10 },
  appName: { fontSize: 20, fontWeight: '700', letterSpacing: 0.3 },
  wifiNameText: { fontSize: 12, marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, gap: 5 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusBadgeText: { fontSize: 11, fontWeight: '500' },
  manageBtn: { padding: 6 },

  btnArea: { alignItems: 'center', justifyContent: 'center', height: BTN_SIZE + 60, marginBottom: 16 },
  ripple: { position: 'absolute', width: BTN_SIZE, height: BTN_SIZE, borderRadius: BTN_SIZE / 2 },
  mainBtn: {
    width: BTN_SIZE, height: BTN_SIZE, borderRadius: BTN_SIZE / 2,
    alignItems: 'center', justifyContent: 'center',
  },

  statusMain: { fontSize: 16, fontWeight: '600', textAlign: 'center', marginBottom: 6 },
  statusHint: { fontSize: 12, textAlign: 'center', marginBottom: 32 },

  logCard: { borderRadius: 16, padding: 16, borderWidth: 1 },
  logTitle: { fontSize: 12, fontWeight: '500', marginBottom: 12 },
  logItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  logLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logText: { fontSize: 14 },
  countBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  countText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  logEmpty: { fontSize: 12, textAlign: 'center', paddingVertical: 12 },
})