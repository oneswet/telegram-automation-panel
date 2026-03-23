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

    // The background worker (/api/cron/process-campaigns) will now pick this up
    // automatically via the dashboard's silent polling loop or external Cron triggers.
    
    return NextResponse.json({ success: true, message: "Campaign orchestrated and delegated to background worker." })
  } catch (error: any) {
    console.error("Campaign execution error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
