import en from './en.json'

export type MessageKey = keyof typeof en

// All UI strings come from en.json (SPEC 5.4); a missing key is a type error.
export function t(key: MessageKey): string {
  return en[key]
}

/** A message with {name} placeholders filled from params; unknown placeholders stay visible. */
export function tf(key: MessageKey, params: Record<string, string>): string {
  return t(key).replace(/\{(\w+)\}/g, (m, name: string) => params[name] ?? m)
}
