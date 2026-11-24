import { useState } from 'react'

// SPEC 12.1: the key lives in memory; "remember on this device" is the only reason it touches localStorage.
const STORAGE_KEY = 'anthropic-api-key'

export function useApiKey() {
  const [key, setKeyState] = useState(() => localStorage.getItem(STORAGE_KEY) ?? '')
  const [remember, setRememberState] = useState(() => localStorage.getItem(STORAGE_KEY) !== null)
  const setKey = (value: string) => {
    setKeyState(value)
    if (remember) localStorage.setItem(STORAGE_KEY, value)
  }
  const setRemember = (on: boolean) => {
    setRememberState(on)
    if (on) localStorage.setItem(STORAGE_KEY, key)
    else localStorage.removeItem(STORAGE_KEY)
  }
  return { key, setKey, remember, setRemember }
}
