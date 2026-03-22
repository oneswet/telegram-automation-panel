import { prisma } from "@/lib/prisma"

export class NotificationService {
  /**
   * Dispatches a highly-formatted administrative alert directly to the configured Telegram Bot.
   * This operates silently and catches its own errors so it never interrupts the main execution flow.
   */
  static async sendAdminAlert(subject: string, message: string, details?: any) {
    try {
      // 1. Fetch the Bot configuration securely from the active Database Settings
      const botTokenSetting = await prisma.systemSetting.findUnique({ where: { key: "TELEGRAM_NOTIFY_BOT_TOKEN" } })
      const chatIdSetting = await prisma.systemSetting.findUnique({ where: { key: "TELEGRAM_NOTIFY_CHAT_ID" } })

      const botToken = botTokenSetting?.value
      const chatId = chatIdSetting?.value

      let formattedMessage = `🚨 *SYSTEM ALERT: ${subject}*\n\n${message}`
      
      if (details) {
         if (typeof details === 'object') {
           formattedMessage += `\n\n\`\`\`json\n${JSON.stringify(details, null, 2)}\n\`\`\``
         } else {
           formattedMessage += `\n\n*Diagnostic Details:*\n\`${details}\``
         }
      }

      // We log it internally regardless of whether Telegram is configured or not
      await prisma.notificationLog.create({
         data: {
            type: subject,
            content: formattedMessage,
            recipient: chatId || 'UNCONFIGURED_CHAT_ID',
            status: (!botToken || !chatId) ? 'SKIPPED_UNCONFIGURED' : 'PENDING'
         }
      })

      if (!botToken || !chatId) {
         console.warn("NotificationService: Missing Bot Token or Chat ID in System Settings. Skipping Telegram dispatch.")
         return false
      }

      // 2. Dispatch via Telegram Bot HTTP API
      const url = `https://api.telegram.org/bot${botToken}/sendMessage`
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: formattedMessage,
          parse_mode: 'Markdown',
        }),
      })

      const result = await response.json()
      
      if (!response.ok || !result.ok) {
        console.error("NotificationService Telegram API Error:", result)
        return false
      }

      return true
    } catch (error) {
      console.error("NotificationService Critical Framework Error:", error)
      return false
    }
  }
}
