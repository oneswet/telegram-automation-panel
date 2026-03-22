import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
     const logs = await prisma.notificationLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100
     })
     return NextResponse.json(logs)
  } catch (error: any) {
     return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
