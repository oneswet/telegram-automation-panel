import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { TelegramService } from "@/lib/services/telegram.service"

// This is a stateless background worker. It can be triggered by a Cron job or a client-side polling loop.
// It securely picks up RUNNING campaigns, respects their strict human-jitter intervals, and dispatches payloads.

export async function GET() {
  try {
    const runningCampaigns = await prisma.campaign.findMany({
      where: { status: "RUNNING" },
      include: {
        accounts: { include: { telegramAccount: true } },
      },
      take: 5 // Process up to 5 campaigns concurrently per worker tick to prevent serverless timeouts
    })

    if (runningCampaigns.length === 0) {
      return NextResponse.json({ status: "idle", message: "No active campaigns currently running." })
    }

    let dispatchedCount = 0

    for (const campaign of runningCampaigns) {
      // 1. Verify if enough time has passed since the last sent message for this specific campaign to respect the randomized jitter
      const lastLog = await prisma.messageLog.findFirst({
        where: { campaignId: campaign.id },
        orderBy: { sentAt: "desc" }
      })

      if (lastLog) {
         const secondsSinceLastSend = (new Date().getTime() - new Date(lastLog.sentAt).getTime()) / 1000
         
         // If we haven't reached the minimum interval yet, safely skip this campaign for this worker tick
         if (secondsSinceLastSend < campaign.intervalMin) {
            continue
         }
      }

      // 2. We are cleared to send. Get dynamic active accounts.
      const activeAccounts = campaign.accounts.filter(a => a.telegramAccount.status === "ACTIVE")
      if (activeAccounts.length === 0) {
        // Halt campaign if no active senders remain
        await prisma.campaign.update({ where: { id: campaign.id }, data: { status: "PAUSED" } })
        continue
      }

      // 3. Select the next target
      const target = await prisma.telegramMember.findFirst({
        where: { campaignId: campaign.id, status: "UNCHECKED" },
        orderBy: { createdAt: "asc" }
      })

      if (!target) {
        // No targets left, gracefully complete the campaign
        await prisma.campaign.update({ where: { id: campaign.id }, data: { status: "COMPLETED" } })
        continue
      }

      // 4. Select sender account (Round Robin based on message logs)
      const totalLogs = await prisma.messageLog.count({ where: { campaignId: campaign.id } })
      const senderAccount = activeAccounts[totalLogs % activeAccounts.length]

      // 5. Blast Payload
      try {
        await TelegramService.sendMessage(
          senderAccount.telegramAccountId,
          target.id,
          campaign.messageTemplate
        )

        await prisma.messageLog.create({
          data: {
            campaignId: campaign.id,
            telegramAccountId: senderAccount.telegramAccountId,
            memberId: target.id,
            status: "SENT",
          }
        })

        await prisma.telegramMember.update({
          where: { id: target.id },
          data: { status: "SENT" },
        })
        
        dispatchedCount++

      } catch (error: any) {
        console.error(`Worker failed targeting ${target.id}:`, error.message)
        
        await prisma.messageLog.create({
          data: {
            campaignId: campaign.id,
            telegramAccountId: senderAccount.telegramAccountId,
            memberId: target.id,
            status: "FAILED",
            errorMessage: error.message,
          }
        })
        
        // Auto-pause if critical limits hit
        if (error.message.includes("PEER_FLOOD") || error.message.includes("USER_BANNED") || error.message.includes("AUTH_KEY_UNREGISTERED")) {
           console.log(`Account ${senderAccount.telegramAccountId} hit a fatal error.`)
           // (Status updates to BANNED are handled elsewhere or could be implemented here)
        }
      }
    }

    return NextResponse.json({ status: "processed", dispatchedCount })

  } catch (error: any) {
    console.error("Critical Background Worker Crash:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
