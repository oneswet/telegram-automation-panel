import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

/**
 * POST — Send a test ping
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
     const botTokenSetting = await prisma.systemSetting.findUnique({ where: { key: "TELEGRAM_NOTIFY_BOT_TOKEN" } })
     const chatIdSetting = await prisma.systemSetting.findUnique({ where: { key: "TELEGRAM_NOTIFY_CHAT_ID" } })

     const botToken = botTokenSetting?.value?.trim()
     const chatId = chatIdSetting?.value?.trim()

     if (!botToken || !chatId) {
       return NextResponse.json({ 
         error: `Missing configuration: ${!botToken ? 'Bot Token is empty.' : ''} ${!chatId ? 'Chat ID is empty.' : ''} Save your settings first.`
       }, { status: 400 })
     }

     const testMessage = `✅ *SYSTEM TEST SUCCESSFUL*\n\n🔔 Your admin notification pipeline is fully operational.\n\n_Timestamp: ${new Date().toISOString()}_\n_Admin: ${session.user.email}_`

     const url = `https://api.telegram.org/bot${botToken}/sendMessage`
     const response = await fetch(url, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         chat_id: chatId,
         text: testMessage,
         parse_mode: 'Markdown',
       }),
     })

     const result = await response.json()

     await prisma.notificationLog.create({
       data: {
         type: 'SYSTEM_TEST',
         content: testMessage,
         recipient: chatId,
         status: result.ok ? 'DISPATCHED' : 'FAILED'
       }
     })

     if (!response.ok || !result.ok) {
       const telegramError = result.description || 'Unknown Telegram API error'
       return NextResponse.json({ error: `Telegram rejected: ${telegramError}` }, { status: 400 })
     }

     return NextResponse.json({ success: true, message: "Test ping successfully delivered to your Telegram!" })
  } catch (error: any) {
     return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * GET — Auto-detect Chat ID from recent bot messages using getUpdates
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
     const botTokenSetting = await prisma.systemSetting.findUnique({ where: { key: "TELEGRAM_NOTIFY_BOT_TOKEN" } })
     const botToken = botTokenSetting?.value?.trim()

     if (!botToken) {
       return NextResponse.json({ error: "Bot Token is not configured. Save your Bot Token first." }, { status: 400 })
     }

     // Call Telegram's getUpdates to find anyone who messaged the bot
     const url = `https://api.telegram.org/bot${botToken}/getUpdates?limit=20`
     const response = await fetch(url)
     const result = await response.json()

     if (!response.ok || !result.ok) {
       return NextResponse.json({ error: `Bot Token seems invalid: ${result.description || 'unknown error'}` }, { status: 400 })
     }

     // Extract unique chat IDs from updates
     const chats: { chatId: string; name: string; username: string }[] = []
     const seen = new Set<string>()

     for (const update of result.result || []) {
       const msg = update.message || update.edited_message
       if (msg?.chat) {
         const id = String(msg.chat.id)
         if (!seen.has(id)) {
           seen.add(id)
           chats.push({
             chatId: id,
             name: [msg.chat.first_name, msg.chat.last_name].filter(Boolean).join(' ') || msg.chat.title || 'Unknown',
             username: msg.chat.username || ''
           })
         }
       }
     }

     if (chats.length === 0) {
       return NextResponse.json({ 
         error: "No conversations found. Open Telegram, search for your bot, and send it /start — then try again.",
         chats: []
       }, { status: 404 })
     }

     return NextResponse.json({ chats })
  } catch (error: any) {
     return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
