import * as Notifications from 'expo-notifications'

let permissionGranted = false

export async function requestPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync()
  if (status === 'granted') {
    permissionGranted = true
    return true
  }
  return false
}

export async function send(
  title: string,
  body: string,
  addLog?: (text: string) => void
): Promise<void> {
  if (!permissionGranted) {
    addLog?.('通知权限未授予')
    return
  }
  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: null,
  })
}
