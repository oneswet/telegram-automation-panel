import { TelegramClient } from "telegram"
import { StringSession } from "telegram/sessions"

// Array of realistic mobile device profiles to evade basic Telegram fingerprinting bans
const deviceProfiles = [
  { deviceModel: "iPhone 15 Pro Max", systemVersion: "17.4.1", appVersion: "10.11.1" },
  { deviceModel: "iPhone 14", systemVersion: "16.6", appVersion: "10.0.1" },
  { deviceModel: "Samsung Galaxy S24 Ultra", systemVersion: "Android 14", appVersion: "10.12.0" },
  { deviceModel: "Google Pixel 8 Pro", systemVersion: "Android 14", appVersion: "10.11.0" },
  { deviceModel: "OnePlus 12", systemVersion: "Android 14", appVersion: "10.10.1" },
  { deviceModel: "Xiaomi 14 Pro", systemVersion: "Android 14", appVersion: "10.9.2" },
]

export const createTelegramClient = (apiId: number, apiHash: string, sessionString = "") => {
  if (!apiId || !apiHash) {
    throw new Error("Telegram API ID and Hash are required. Please provide them in the UI.");
  }
  const session = new StringSession(sessionString)
  
  // Pick a random device profile so Telegram sees a diverse range of physical phones
  const profile = deviceProfiles[Math.floor(Math.random() * deviceProfiles.length)]

  const client = new TelegramClient(session, apiId, apiHash, {
    connectionRetries: 5,
    deviceModel: profile.deviceModel,
    systemVersion: profile.systemVersion,
    appVersion: profile.appVersion,
    useWSS: false, // Force standard MTProto over TCP for maximum native-app realism
  })
  return client
}

// Global store for clients during auth flow (in-memory, use with caution)
// In production, you might want to use a more persistent store or a specific service
const pendingClients = new Map<string, { client: TelegramClient, apiId: number, apiHash: string }>()

export const setPendingClient = (phone: string, client: TelegramClient, apiId: number, apiHash: string) => {
  pendingClients.set(phone, { client, apiId, apiHash })
}

export const getPendingClient = (phone: string) => {
  return pendingClients.get(phone)
}

export const removePendingClient = (phone: string) => {
  pendingClients.delete(phone)
}
