import React from 'react'
import {
  Alert,
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { useSettings } from '../utils/SettingsContext'

export default function SettingsScreen() {
  const { bgImage, setBgImage, isDark, toggleTheme, autoCheck, toggleAutoCheck, theme } = useSettings()

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('提示', '需要相册权限才能选择背景图片')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    })
    if (!result.canceled && result.assets[0]) {
      await setBgImage(result.assets[0].uri)
    }
  }

  const clearImage = () => {
    Alert.alert('清除背景', '确认恢复默认背景？', [
      { text: '取消', style: 'cancel' },
      { text: '确认', style: 'destructive', onPress: () => setBgImage(null) },
    ])
  }

  const content = (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={[styles.navbar, { borderBottomColor: theme.border }]}>
        <Text style={[styles.navTitle, { color: theme.text }]}>设置</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <Text style={[styles.sectionLabel, { color: theme.subText }]}>外观</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>

          {/* 日夜切换 */}
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrap, { backgroundColor: isDark ? 'rgba(255,204,0,0.15)' : 'rgba(90,90,90,0.12)' }]}>
                <Ionicons name={isDark ? 'moon' : 'sunny'} size={18} color={isDark ? '#ffcc00' : '#636366'} />
              </View>
              <Text style={[styles.rowLabel, { color: theme.text }]}>{isDark ? '深色模式' : '浅色模式'}</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#e5e5ea', true: '#0071e3' }}
              thumbColor="#fff"
            />
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* 背景图片选取 */}
          <TouchableOpacity style={styles.row} onPress={pickImage} activeOpacity={0.7}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrap, { backgroundColor: 'rgba(0,113,227,0.15)' }]}>
                <Ionicons name="image-outline" size={18} color="#0071e3" />
              </View>
              <Text style={[styles.rowLabel, { color: theme.text }]}>全局背景图片</Text>
            </View>
            <View style={styles.rowRight}>
              {bgImage ? (
                <Image source={{ uri: bgImage }} style={styles.bgThumb} />
              ) : (
                <Text style={[styles.rowValue, { color: theme.subText }]}>未设置</Text>
              )}
              <Ionicons name="chevron-forward" size={16} color={theme.subText} />
            </View>
          </TouchableOpacity>

          {bgImage && (
            <>
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
              <TouchableOpacity style={styles.row} onPress={clearImage} activeOpacity={0.7}>
                <View style={styles.rowLeft}>
                  <View style={[styles.iconWrap, { backgroundColor: 'rgba(255,59,48,0.12)' }]}>
                    <Ionicons name="trash-outline" size={18} color="#ff3b30" />
                  </View>
                  <Text style={[styles.rowLabel, { color: '#ff3b30' }]}>清除背景图片</Text>
                </View>
              </TouchableOpacity>
            </>
          )}
        </View>

        <Text style={[styles.sectionLabel, { color: theme.subText }]}>功能</Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrap, { backgroundColor: 'rgba(10,132,255,0.15)' }]}>
                <Ionicons name="sync" size={18} color="#0a84ff" />
              </View>
              <Text style={[styles.rowLabel, { color: theme.text }]}>自动检查网络</Text>
            </View>
            <Switch
              value={autoCheck}
              onValueChange={toggleAutoCheck}
              trackColor={{ false: '#e5e5ea', true: '#0a84ff' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: theme.subText }]}>关于</Text>
        <TouchableOpacity style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]} onPress={() => {
          Alert.alert('关于千秋 WIFI', '本程序是为了解决许昌校区校园网链接繁琐、容易掉线的问题。\n\n项目由老学长开发，希望同学们砥砺前行。', [{ text: '确定' }])
        }} activeOpacity={0.7}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrap, { backgroundColor: 'rgba(52,199,89,0.12)' }]}>
                <Ionicons name="wifi" size={18} color="#34c759" />
              </View>
              <Text style={[styles.rowLabel, { color: theme.text }]}>千秋 WIFI</Text>
            </View>
            <View style={styles.rowRight}>
              <Text style={[styles.rowValue, { color: theme.subText }]}>v1.0.0</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.subText} />
            </View>
          </View>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  )

  if (bgImage) {
    return (
      <ImageBackground source={{ uri: bgImage }} style={{ flex: 1, backgroundColor: theme.bg }}>
        <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.15)' }}>{content}</View>
      </ImageBackground>
    )
  }
  return <View style={{ flex: 1, backgroundColor: theme.bg }}>{content}</View>
}

const styles = StyleSheet.create({
  navbar: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  navTitle: { fontSize: 18, fontWeight: '700' },
  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconWrap: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontSize: 15 },
  rowValue: { fontSize: 14 },
  bgThumb: { width: 54, height: 32, borderRadius: 6 },
  divider: { height: 1, marginHorizontal: 16 },
})
