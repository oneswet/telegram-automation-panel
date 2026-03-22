import { createTelegramClient } from "@/lib/telegram"
import { prisma } from "@/lib/prisma"

export class TelegramService {
  /**
   * Scrape members from a Telegram group
   */
  static async scrapeMembers(accountId: string, groupLink: string, userId: string, onProgress?: (count: number) => void) {
    const account = await prisma.telegramAccount.findUnique({
      where: { id: accountId },
    })

    if (!account || !account.session || !account.apiId || !account.apiHash) {
      throw new Error("Telegram account missing credentials or session")
    }

    const client = createTelegramClient(Number(account.apiId), account.apiHash, account.session)
    await client.connect()

    try {
      const entity = await client.getEntity(groupLink)
      
      let totalCount = 0;
      let memberBatch: any[] = [];
      const batchSize = 50; // Save to DB in smaller chunks of 50 for live updates and speed

      // Secure chunked scraping using Async Iterator instead of bulk 'getParticipants'
      for await (const p of client.iterParticipants(entity, { limit: 10000 })) {
        memberBatch.push({
          telegramId: p.id.toString(),
          username: p.username || null,
          firstName: p.firstName || null,
          lastName: p.lastName || null,
          status: "UNCHECKED",
          userId: userId, // Accurately route to the admin initiating the scrape
          sourceGroupId: groupLink
        })

        // Upon generating a batch payload, upsert it and inject an anti-ban jitter
        if (memberBatch.length >= batchSize) {
          await prisma.$transaction(
            async (tx) => {
              await Promise.all(
                memberBatch.map((member) =>
                  tx.telegramMember.upsert({
                    where: { telegramId: member.telegramId },
                    update: { ...member },
                    create: { ...member },
                  })
                )
              )
            },
            { timeout: 35000 }
          )
          totalCount += memberBatch.length;
          memberBatch = [];
          if (onProgress) onProgress(totalCount);

          // Smart Anti-Ban Jitter Delay after every 100 scans (2 to 5 seconds)
          const jitterDelay = Math.floor(Math.random() * 3000) + 2000;
          await new Promise(resolve => setTimeout(resolve, jitterDelay));
        }
      }

      // Final remainder batch insert
      if (memberBatch.length > 0) {
         await prisma.$transaction(
            async (tx) => {
              await Promise.all(
                memberBatch.map((member) =>
                  tx.telegramMember.upsert({
                    where: { telegramId: member.telegramId },
                    update: { ...member },
                    create: { ...member },
                  })
                )
              )
            },
            { timeout: 35000 }
          )
         totalCount += memberBatch.length;
         if (onProgress) onProgress(totalCount);
      }

      return { count: totalCount }
    } catch (error: any) {
      console.error("Scraping error:", error)
      if (error.message.includes("FLOOD_WAIT")) {
         const match = error.message.match(/FLOOD_WAIT_(\d+)/);
         if (match) {
           console.warn(`Scraping halted via FloodWait for ${match[1]} seconds on account ${account.phone}`);
         }
      } else if (error.message.includes("PEER_FLOOD") || error.message.includes("USER_DEACTIVATED") || error.message.includes("AUTH_KEY_UNREGISTERED")) {
        await prisma.telegramAccount.update({
          where: { id: accountId },
          data: { status: "BANNED" },
        })
      }
      throw error
    } finally {
      await client.disconnect()
    }
  }

  /**
   * Send a message to a member
   */
  static async sendMessage(accountId: string, memberId: string, message: string) {
    const account = await prisma.telegramAccount.findUnique({
      where: { id: accountId },
    })

    if (!account || !account.session || !account.apiId || !account.apiHash) {
      throw new Error("Telegram account missing credentials or session")
    }

    const member = await prisma.telegramMember.findUnique({
      where: { id: memberId },
    })

    if (!member) {
      throw new Error("Member not found")
    }

    const client = createTelegramClient(Number(account.apiId), account.apiHash, account.session)
    await client.connect()

    try {
      await client.sendMessage(member.telegramId, { message })
      return { success: true }
    } catch (error: any) {
      console.error("Send message error:", error)
      if (error.message.includes("PEER_FLOOD") || error.message.includes("USER_BANNED_IN_CHANNEL")) {
        await prisma.telegramAccount.update({
          where: { id: accountId },
          data: { status: "LIMITED" },
        })
      }
      throw error
    } finally {
      await client.disconnect()
    }
  }

  /**
   * Send a direct message using a raw target username or numerical ID (for tests)
   */
  static async sendDirectMessage(accountId: string, target: string, message: string) {
    const account = await prisma.telegramAccount.findUnique({
      where: { id: accountId },
    })

    if (!account || !account.session || !account.apiId || !account.apiHash) {
      throw new Error("Telegram account missing credentials or session")
    }

    const client = createTelegramClient(Number(account.apiId), account.apiHash, account.session)
    await client.connect()

    try {
      await client.sendMessage(target, { message })
      return { success: true }
    } catch (error: any) {
      console.error("Direct send message error:", error)
      if (error.message.includes("PEER_FLOOD") || error.message.includes("USER_BANNED_IN_CHANNEL") || error.message.includes("USER_DEACTIVATED") || error.message.includes("AUTH_KEY_UNREGISTERED")) {
        await prisma.telegramAccount.update({
          where: { id: accountId },
          data: { status: "LIMITED" },
        })
      }
      throw error
    } finally {
      await client.disconnect()
    }
  }
}

