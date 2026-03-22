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
  const statusFilter = searchParams.get("status")
  const search = searchParams.get("search")
  
  const page = parseInt(searchParams.get("page") || "1", 10)
  const limit = parseInt(searchParams.get("limit") || "100", 10)

  try {
    const whereClause: any = { userId: session.user.id }
    
    if (campaignId && campaignId !== "ALL") {
      whereClause.campaignId = campaignId
    }
    
    if (statusFilter && statusFilter !== "ALL") {
      whereClause.status = statusFilter
    }

    if (search) {
      whereClause.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { telegramId: { contains: search } }
      ]
    }

    const total = await prisma.telegramMember.count({ where: whereClause })
    const skip = (page - 1) * limit

    const members = await prisma.telegramMember.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: { campaign: { select: { name: true } } },
    })

    return NextResponse.json({
      data: members,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error: any) {
    console.error("Fetch members error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const data = await req.json()
  const { username, firstName, lastName, campaignId } = data

  if (!username && !firstName) {
    return NextResponse.json({ error: "Username or First Name is required" }, { status: 400 })
  }

  try {
    const member = await prisma.telegramMember.create({
      data: {
        userId: session.user.id,
        username,
        firstName,
        lastName,
        campaignId,
        telegramId: "MANUAL_" + Date.now(), // Unique temporary ID for manual adds
        status: "UNCHECKED"
      },
    })
    return NextResponse.json({ success: true, member })
  } catch (error: any) {
    console.error("Create member error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  const deleteAll = searchParams.get("deleteAll")
  const campaignId = searchParams.get("campaignId")
  const bulkIdsStr = searchParams.get("ids")

  try {
    if (bulkIdsStr) {
       const idsObj = JSON.parse(bulkIdsStr);
       if (Array.isArray(idsObj) && idsObj.length > 0) {
          const deleted = await prisma.telegramMember.deleteMany({
             where: { id: { in: idsObj }, userId: session.user.id }
          })
          return NextResponse.json({ success: true, count: deleted.count })
       }
    }

    if (deleteAll === "true") {
      const where: any = { userId: session.user.id }
      if (campaignId && campaignId !== "ALL") where.campaignId = campaignId;
      
      const deleted = await prisma.telegramMember.deleteMany({ where })
      return NextResponse.json({ success: true, count: deleted.count })
    }

    if (!id) {
      return NextResponse.json({ error: "Member ID is required" }, { status: 400 })
    }

    await prisma.telegramMember.deleteMany({
      where: { id, userId: session.user.id },
    })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Delete member error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
