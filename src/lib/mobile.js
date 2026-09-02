// Fit Ninjas Web & PWA Storage & Export Engine
import { t } from './i18n.js'

export const MOBILE = false

const FILE = 'fitninja-state.json'

export async function nativeLoad() {
  return null
}

export async function nativeSave(state) {
  try {
    localStorage.setItem(FILE, JSON.stringify(state))
  } catch (e) {}
}

export async function syncReminder(S, interactive = false) {
  return true
}

export async function shareExport(json, filename) {
  try {
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename || 'fitninjas-backup.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (e) {
    console.error('Export failed:', e)
  }
}
