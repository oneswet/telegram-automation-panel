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

  const { campaignId, targetUsername, accountId } = await req.json()

  if (!campaignId || !targetUsername || !accountId) {
    return NextResponse.json({ error: "Campaign, Target Username, and sender Account are strictly required" }, { status: 400 })
  }

  try {
    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } })
    if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 })

    // Use the actual Telegram Service to blast a single message directly to the username
    await TelegramService.sendDirectMessage(
      accountId,
      targetUsername, // We pass the username exactly as provided by the admin for testing
      campaign.messageTemplate
    )

    return NextResponse.json({ success: true, message: "Test message successfully dispatched." })
  } catch (error: any) {
    console.error("Test send error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
