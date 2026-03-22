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
    const settings = await prisma.systemSetting.findMany()
    const settingsMap = settings.reduce((acc, current) => {
      acc[current.key] = current.value
      return acc
    }, {} as Record<string, string>)
    
    return NextResponse.json(settingsMap)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    // Body is expected to be a key-value record
    const updates = []
    for (const [key, value] of Object.entries(body)) {
      if (typeof value === 'string') {
         updates.push(
           prisma.systemSetting.upsert({
             where: { key },
             update: { value },
             create: { key, value }
           })
         )
      }
    }
    
    await Promise.all(updates)
    return NextResponse.json({ success: true, message: "System configuration updated securely." })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
