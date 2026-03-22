import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const [
      totalAccounts,
      activeCampaigns,
      totalMembers,
      totalMessages,
      recentLogs
    ] = await Promise.all([
      prisma.telegramAccount.count(), // Accounts don't have userId currently, they are global available
      prisma.campaign.count({ where: { status: "RUNNING", userId: session.user.id } }),
      prisma.telegramMember.count({ where: { userId: session.user.id } }),
      prisma.messageLog.count({ where: { status: "SENT", userId: session.user.id } }),
      prisma.messageLog.findMany({
        where: { userId: session.user.id },
        orderBy: { sentAt: "desc" },
        take: 5,
        include: {
          member: true,
          telegramAccount: true,
          campaign: true,
        },
      }),
    ])

    return NextResponse.json({
      stats: {
        totalAccounts,
        activeCampaigns,
        totalMembers,
        totalMessages,
      },
      recentLogs,
    })
  } catch (error: any) {
    console.error("Dashboard stats error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
