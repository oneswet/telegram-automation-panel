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
    const tAccountWhere: any = session.user.role === 'ADMIN' ? {} : { userId: session.user.id }
    const cWhere: any = session.user.role === 'ADMIN' ? { status: "RUNNING" } : { status: "RUNNING", userId: session.user.id }
    const mWhere: any = session.user.role === 'ADMIN' ? {} : { userId: session.user.id }
    const lWhere: any = session.user.role === 'ADMIN' ? { status: "SENT" } : { status: "SENT", userId: session.user.id }
    const rLWhere: any = session.user.role === 'ADMIN' ? {} : { userId: session.user.id }

    const [
      totalAccounts,
      activeCampaigns,
      totalMembers,
      totalMessages,
      recentLogs
    ] = await Promise.all([
      prisma.telegramAccount.count({ where: tAccountWhere }),
      prisma.campaign.count({ where: cWhere }),
      prisma.telegramMember.count({ where: mWhere }),
      prisma.messageLog.count({ where: lWhere }),
      prisma.messageLog.findMany({
        where: rLWhere,
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
