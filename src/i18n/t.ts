import en from './en.json'

export type MessageKey = keyof typeof en

// All UI strings come from en.json (SPEC 5.4); a missing key is a type error.
export function t(key: MessageKey): string {
  return en[key]
}
