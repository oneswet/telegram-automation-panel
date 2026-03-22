import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { TelegramService } from "@/lib/services/telegram.service"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { campaignId } = await req.json()

  if (!campaignId) {
    return NextResponse.json({ error: "Campaign ID is required" }, { status: 400 })
  }

  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        accounts: { include: { telegramAccount: true } },
        members: true,
      },
    })

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    if (campaign.status === "RUNNING") {
      return NextResponse.json({ error: "Campaign is already currently executing." }, { status: 400 })
    }

    // Update campaign status
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: "RUNNING" },
    });

    // Orchestrate sending in background (using a detached process or simpler loop for now)
    // NOTE: In Vercel, this will time out. For production, use a separate worker.
    // For local dev, this loop works fine.
    
    ;(async () => {
      const activeAccounts = campaign.accounts.filter((a: any) => a.telegramAccount.status === "ACTIVE")
      const members = campaign.members.filter((m: any) => m.status === "UNCHECKED")
      
      let currentAccountIndex = 0
      
      for (const member of members) {
        // Fetch latest campaign status to check for pauses/stops
        const currentCampaign = await prisma.campaign.findUnique({ 
          where: { id: campaignId },
          include: { accounts: { include: { telegramAccount: true } } }
        })
        if (currentCampaign?.status !== "RUNNING") break

        // Dynamically reload active accounts to immediately drop any that get banned/limited mid-campaign
        const dynamicActiveAccounts = currentCampaign.accounts.filter((a: any) => a.telegramAccount.status === "ACTIVE")
        if (dynamicActiveAccounts.length === 0) {
          console.error("No active accounts remaining for campaign", campaignId)
          await prisma.campaign.update({ where: { id: campaignId }, data: { status: "PAUSED" } })
          break
        }

        const currentAccount = dynamicActiveAccounts[currentAccountIndex % dynamicActiveAccounts.length]
        if (!currentAccount) break

        try {
          // Randomized delay
          const delay = Math.floor(Math.random() * (campaign.intervalMax - campaign.intervalMin + 1)) + campaign.intervalMin
          await new Promise(resolve => setTimeout(resolve, delay * 1000))

          await TelegramService.sendMessage(
            currentAccount.telegramAccountId,
            member.id,
            campaign.messageTemplate
          )

          await prisma.messageLog.create({
            data: {
              campaignId,
              telegramAccountId: currentAccount.telegramAccountId,
              memberId: member.id,
              status: "SENT",
            }
          })

          await prisma.telegramMember.update({
            where: { id: member.id },
            data: { status: "SENT" },
          })
        } catch (error: any) {
          console.error(`Failed to send to member ${member.id}:`, error)
          await prisma.messageLog.create({
            data: {
              campaignId,
              telegramAccountId: currentAccount.telegramAccountId,
              memberId: member.id,
              status: "FAILED",
              errorMessage: error.message,
            }
          })
          
          if (error.message.includes("PEER_FLOOD") || error.message.includes("USER_BANNED_IN_CHANNEL") || error.message.includes("USER_DEACTIVATED") || error.message.includes("AUTH_KEY_UNREGISTERED")) {
            // Account rotation logic will automatically skip this account on the next loop 
            // because dynamicActiveAccounts will exclude it once marked LIMITED or BANNED in DB
            console.log(`Account ${currentAccount.telegramAccountId} hit a limit or ban.`)
          } else if (error.message.includes("FLOOD_WAIT")) {
            // Extract seconds from 'FLOOD_WAIT_37'
            const match = error.message.match(/FLOOD_WAIT_(\d+)/)
            if (match) {
              const waitSeconds = parseInt(match[1], 10)
              console.log(`Account hit FLOOD_WAIT. Pausing this specific action account for ${waitSeconds} seconds.`)
              // We could pause, but rotating is safer
            }
          }
        }

        // Account rotation: Spread load across all CURRENTLY active accounts
        currentAccountIndex = (currentAccountIndex + 1) % dynamicActiveAccounts.length
      }

      await prisma.campaign.update({
        where: { id: campaignId },
        data: { status: "COMPLETED" },
      })
    })()

    return NextResponse.json({ success: true, message: "Campaign started" })
  } catch (error: any) {
    console.error("Campaign execution error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
