import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const campaignId = searchParams.get("campaignId")
  const status = searchParams.get("status")
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")
  
  // For export mode, we might want ALL logs without pagination limit
  const isExport = searchParams.get("export") === "true"
  
  const page = parseInt(searchParams.get("page") || "1", 10)
  const limit = isExport ? undefined : parseInt(searchParams.get("limit") || "100", 10)
  const skip = isExport ? undefined : (page - 1) * (limit || 100)

  try {
    const whereClause: any = { userId: session.user.id }
    
    if (campaignId && campaignId !== "ALL") {
      whereClause.campaignId = campaignId
    }
    
    if (status && status !== "ALL") {
      whereClause.status = status
    }

    if (startDate || endDate) {
      whereClause.sentAt = {}
      if (startDate) whereClause.sentAt.gte = new Date(startDate)
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        whereClause.sentAt.lte = end
      }
    }

    const total = await prisma.messageLog.count({ where: whereClause })

    const logs = await prisma.messageLog.findMany({
      where: whereClause,
      orderBy: { sentAt: "desc" },
      skip,
      take: limit,
      include: {
        campaign: { select: { name: true } },
        member: { select: { username: true, telegramId: true, firstName: true } },
        telegramAccount: { select: { phone: true, name: true } }
      },
    })

    return NextResponse.json({
      data: logs,
      meta: {
        total,
        page: isExport ? 1 : page,
        limit: isExport ? total : limit,
        totalPages: isExport ? 1 : Math.ceil(total / (limit || 100))
      }
    })
  } catch (error: any) {
    console.error("Fetch logs error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
