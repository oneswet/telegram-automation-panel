import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: "Unauthorized / Admin Only" }, { status: 401 })
  }

  // Get date range (default last 14 days)
  const d = new Date()
  d.setDate(d.getDate() - 14)
  const gte = d

  try {
     // 1. Total Visits
     // @ts-ignore - IDE Cache Issue
     const totalVisits = await prisma.siteVisit.count()

     // 2. Browser Distribution
     // @ts-ignore - IDE Cache Issue
     const browsers = await prisma.siteVisit.groupBy({
        by: ['browser'],
        _count: { browser: true },
        where: { createdAt: { gte } },
        orderBy: { _count: { browser: 'desc' } }
     })

     // 3. Device Distribution
     // @ts-ignore - IDE Cache Issue
     const devices = await prisma.siteVisit.groupBy({
        by: ['device'],
        _count: { device: true },
        where: { createdAt: { gte } },
        orderBy: { _count: { device: 'desc' } }
     })

     // 4. Top Countries
     // @ts-ignore - IDE Cache Issue
     const countries = await prisma.siteVisit.groupBy({
        by: ['country'],
        _count: { country: true },
        where: { createdAt: { gte } },
        orderBy: { _count: { country: 'desc' } },
        take: 10
     })

     // 5. Recent Traffic Array
     // @ts-ignore - IDE Cache Issue
     const recentHits = await prisma.siteVisit.findMany({
        orderBy: { createdAt: 'desc' },
        take: 25
     })

     return NextResponse.json({
         totalVisits,
         browsers: browsers.map((b: any) => ({ name: b.browser || 'Unknown', value: b._count.browser })),
         devices: devices.map((d: any) => ({ name: d.device || 'Unknown', value: d._count.device })),
         countries: countries.map((c: any) => ({ name: c.country || 'Unknown', value: c._count.country })),
         recent: recentHits
     })

  } catch (error: any) {
     return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
