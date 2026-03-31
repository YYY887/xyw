import React, { useEffect } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createStackNavigator } from '@react-navigation/stack'
import { Ionicons } from '@expo/vector-icons'
import { LogProvider, useLog } from './src/utils/LogConsole'
import { AccountProvider } from './src/utils/AccountContext'
import { SettingsProvider, useSettings } from './src/utils/SettingsContext'
import HomeScreen from './src/screens/HomeScreen'
import ManageScreen from './src/screens/ManageScreen'
import SettingsScreen from './src/screens/SettingsScreen'
import { requestPermission } from './src/services/NotificationService'

const Tab = createBottomTabNavigator()
const Stack = createStackNavigator()

function MainTabs() {
  const { addLog } = useLog()
  const { theme } = useSettings()

  useEffect(() => {
    requestPermission().then(granted => {
      if (!granted) addLog('通知权限未授予')
    })
  }, [])

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.navBg,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 16,
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#34c759',
        tabBarInactiveTintColor: theme.subText,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '500' },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: '首页',
          tabBarIcon: ({ color, size }) => <Ionicons name="wifi" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: '设置',
          tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  )
}

export default function App() {
  return (
    <LogProvider>
      <AccountProvider>
        <SettingsProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Main" component={MainTabs} />
              <Stack.Screen name="Manage" component={ManageScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </SettingsProvider>
      </AccountProvider>
    </LogProvider>
  )
}