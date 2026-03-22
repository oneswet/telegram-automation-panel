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
    const campaigns = await prisma.campaign.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        accounts: { include: { telegramAccount: true } },
        _count: { select: { members: true, messageLogs: true } },
      },
    })
    return NextResponse.json(campaigns)
  } catch (error: any) {
    console.error("Fetch campaigns error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const data = await req.json()
  const { name, messageTemplate, accounts, intervalMin, intervalMax } = data

  if (!name || !messageTemplate || !accounts || accounts.length === 0) {
    return NextResponse.json({ error: "Name, message template, and at least one account are required" }, { status: 400 })
  }

  try {
    const campaign = await prisma.campaign.create({
      data: {
        name,
        messageTemplate,
        intervalMin: Number(intervalMin) || 30,
        intervalMax: Number(intervalMax) || 60,
        userId: session.user.id,
        status: "PENDING",
        accounts: {
          create: accounts.map((accountId: string) => ({
            telegramAccountId: accountId,
          })),
        },
      },
    })
    return NextResponse.json({ success: true, campaign })
  } catch (error: any) {
    console.error("Create campaign error:", error)
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

  if (!id) {
    return NextResponse.json({ error: "Campaign ID is required" }, { status: 400 })
  }

  try {
    await prisma.campaign.delete({
      where: { id, userId: session.user.id },
    })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Delete campaign error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
