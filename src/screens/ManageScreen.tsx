import React, { useState } from 'react'
import {
  Alert,
  FlatList,
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useLog } from '../utils/LogConsole'
import { useAccounts } from '../utils/AccountContext'
import { useSettings } from '../utils/SettingsContext'
import { Account } from '../types'

export default function ManageScreen({ navigation }: { navigation: any }) {
  const { addLog } = useLog()
  const { accounts, saveAccounts } = useAccounts()
  const { bgImage, theme, isDark } = useSettings()

  const [showModal, setShowModal] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const handleAdd = async () => {
    if (!username.trim() || !password.trim()) { Alert.alert('提示', '请填写完整信息'); return }
    const newAcc: Account = { id: Date.now(), username: username.trim(), password: password.trim(), enabled: true }
    await saveAccounts([...accounts, newAcc])
    setUsername(''); setPassword(''); setShowModal(false)
    addLog(`已添加: ${newAcc.username}`)
  }

  const handleToggle = async (id: number, val: boolean) => {
    await saveAccounts(accounts.map(a => a.id === id ? { ...a, enabled: val } : a))
  }

  const handleDelete = (id: number, name: string) => {
    Alert.alert('删除账号', `确认删除 "${name}"？`, [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: async () => {
        await saveAccounts(accounts.filter(a => a.id !== id))
        addLog(`已删除: ${name}`)
      }},
    ])
  }

  const content = (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={[styles.navbar, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: theme.text }]}>账号管理</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)} activeOpacity={0.85}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.addBtnText}>添加</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={accounts}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="people-outline" size={56} color={theme.subText} />
            <Text style={[styles.emptyText, { color: theme.subText }]}>暂无账号</Text>
            <Text style={[styles.emptyHint, { color: theme.subText }]}>点击右上角「添加」</Text>
          </View>
        }
        renderItem={({ item: acc, index }) => (
          <View style={[
            styles.accRow,
            { backgroundColor: theme.card, borderColor: theme.cardBorder },
            index > 0 && { marginTop: 8 },
          ]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.accName, { color: theme.text }]} numberOfLines={1}>{acc.username}</Text>
              <Text style={[styles.accStatus, { color: acc.enabled ? '#34c759' : theme.subText }]}>
                {acc.enabled ? '● 启用' : '○ 禁用'}
              </Text>
            </View>
            <Switch
              value={acc.enabled}
              onValueChange={v => handleToggle(acc.id, v)}
              trackColor={{ false: isDark ? '#2a2a2a' : '#e5e5ea', true: '#0071e3' }}
              thumbColor="#fff"
              style={{ marginRight: 10 }}
            />
            <TouchableOpacity onPress={() => handleDelete(acc.id, acc.username)} style={styles.deleteBtn} activeOpacity={0.7}>
              <Ionicons name="trash-outline" size={17} color="#ff3b30" />
            </TouchableOpacity>
          </View>
        )}
      />

      {/* 新增账号弹窗 */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowModal(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ justifyContent: 'flex-end' }}>
            <TouchableOpacity activeOpacity={1} style={[styles.sheet, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
              <View style={styles.handle} />
              <Text style={[styles.sheetTitle, { color: theme.text }]}>新增账号</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.input, color: theme.text, borderColor: theme.cardBorder }]}
                placeholder="用户名 / 手机号"
                placeholderTextColor={theme.subText}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoFocus
              />
              <TextInput
                style={[styles.input, { backgroundColor: theme.input, color: theme.text, borderColor: theme.cardBorder }]}
                placeholder="密码"
                placeholderTextColor={theme.subText}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.cancelBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#e5e5ea' }]}
                  onPress={() => { setShowModal(false); setUsername(''); setPassword('') }}
                >
                  <Text style={[styles.cancelText, { color: theme.subText }]}>取消</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmBtn} onPress={handleAdd}>
                  <Text style={styles.confirmText}>确认添加</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  )

  if (bgImage) {
    return (
      <ImageBackground source={{ uri: bgImage }} style={[styles.bg, { backgroundColor: theme.bg }]}>
        <View style={[styles.bgOverlay, { backgroundColor: theme.overlay }]}>{content}</View>
      </ImageBackground>
    )
  }
  return <View style={[styles.bg, { backgroundColor: theme.bg }]}>{content}</View>
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  bgOverlay: { flex: 1 },

  navbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1,
  },
  navTitle: { fontSize: 18, fontWeight: '700' },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#0071e3',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, gap: 4,
  },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  listContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 },

  emptyBox: { alignItems: 'center', paddingTop: 100, gap: 10 },
  emptyText: { fontSize: 16, fontWeight: '600' },
  emptyHint: { fontSize: 13 },

  accRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, borderWidth: 1,
  },
  accName: { fontSize: 15, fontWeight: '500' },
  accStatus: { fontSize: 12, marginTop: 2 },
  deleteBtn: { padding: 6, backgroundColor: 'rgba(255,59,48,0.1)', borderRadius: 8 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  handle: { width: 40, height: 4, backgroundColor: 'rgba(128,128,128,0.4)', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 18, fontWeight: '700', marginBottom: 20 },
  input: {
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, marginBottom: 12, borderWidth: 1,
  },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  cancelText: { fontSize: 15, fontWeight: '600' },
  confirmBtn: { flex: 2, backgroundColor: '#0071e3', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  confirmText: { color: '#fff', fontSize: 15, fontWeight: '600' },
})
