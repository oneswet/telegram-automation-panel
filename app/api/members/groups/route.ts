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
    // Get distinct source groups with counts
    const groups = await prisma.telegramMember.groupBy({
      by: ['sourceGroupId'],
      where: { 
        userId: session.user.id,
        sourceGroupId: { not: null }
      },
      _count: { _all: true }
    })

    const result = groups.map(g => ({
      sourceGroupId: g.sourceGroupId,
      memberCount: g._count._all
    }))

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
