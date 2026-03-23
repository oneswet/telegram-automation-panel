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
    const whereClause = session.user.role === 'ADMIN' ? {} : { userId: session.user.id }
    
    const accounts = await prisma.telegramAccount.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(accounts)
  } catch (error: any) {
    console.error("Fetch accounts error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await req.json()
  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 })
  }

  try {
    const whereClause = session.user.role === 'ADMIN' ? { id } : { id, userId: session.user.id }
    
    await prisma.telegramAccount.deleteMany({
      where: whereClause,
    })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Delete account error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
