import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { campaignId, mode, sourceGroupIds, memberIds, usernames } = body
    if (!campaignId) return NextResponse.json({ error: "Campaign ID required" }, { status: 400 })

    let count = 0

    if (mode === 'groups' && sourceGroupIds?.length) {
      const result = await prisma.telegramMember.updateMany({
        where: {
          // @ts-ignore - Turbopack IDE Cache
          userId: session.user.id,
          sourceGroupId: { in: sourceGroupIds },
        },
        data: { campaignId, status: 'UNCHECKED' }
      })
      count = result.count

    } else if (mode === 'members' && memberIds?.length) {
      const result = await prisma.telegramMember.updateMany({
        where: {
          id: { in: memberIds },
          // @ts-ignore - Turbopack IDE Cache
          userId: session.user.id,
        },
        data: { campaignId, status: 'UNCHECKED' }
      })
      count = result.count

    } else if (mode === 'manual' && usernames?.length) {
      const created = await Promise.all(
        usernames.map((username: string) =>
          prisma.telegramMember.upsert({
            where: { telegramId: username },
            // @ts-ignore - Turbopack IDE Cache
            update: { campaignId, status: 'UNCHECKED', userId: session.user.id },
            create: {
              telegramId: username,
              username: username,
              status: 'UNCHECKED',
              campaignId,
              // @ts-ignore - Turbopack IDE Cache
              userId: session.user.id,
              sourceGroupId: 'MANUAL_ENTRY'
            }
          })
        )
      )
      count = created.length

    } else if (mode === 'all') {
      const result = await prisma.telegramMember.updateMany({
        where: {
          // @ts-ignore - Turbopack IDE Cache
          userId: session.user.id,
        },
        data: { campaignId, status: 'UNCHECKED' }
      })
      count = result.count

    } else {
      return NextResponse.json({ error: "Invalid targeting mode" }, { status: 400 })
    }

    return NextResponse.json({ success: true, count })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
