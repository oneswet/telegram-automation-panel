import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { NotificationService } from "@/lib/services/notification.service"
import crypto from "crypto"

function parseUserAgent(ua: string) {
  const isMobile = /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(ua)
  const isTablet = /(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)
  const device = isTablet ? 'Tablet' : isMobile ? 'Mobile' : 'Desktop'
  
  let browser = 'Unknown Browser'
  if (ua.includes('Edg')) browser = 'Edge'
  else if (ua.includes('Chrome')) browser = 'Chrome'
  else if (ua.includes('Firefox')) browser = 'Firefox'
  else if (ua.includes('Safari')) browser = 'Safari'
  else if (ua.includes('Opera')) browser = 'Opera'
  
  let os = 'Unknown OS'
  if (ua.includes('Win')) os = 'Windows'
  else if (ua.includes('Mac')) os = 'MacOS'
  else if (ua.includes('Android')) os = 'Android'
  else if (ua.includes('Linux')) os = 'Linux'
  else if (ua.includes('iPhone')) os = 'iOS'

  return { device, browser, os }
}

export async function POST(req: NextRequest) {
  try {
     const body = await req.json()
     const { path, details, source } = body

     // Parse IP natively via standard Reverse Proxy headers or Next.js Edge headers
     const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '0.0.0.0'
     const hashedIp = crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16)
     
     // Fetch real Geolocation data precisely from external generic API to bypass Netlify missing headers
     let country = 'Unknown Country'
     let city = 'Unknown City'
     let isp = 'Unknown ISP'
     try {
       if (ip !== '0.0.0.0' && ip !== '127.0.0.1' && ip !== 'localhost') {
         const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,city,isp`, { cache: 'no-store' })
         const geoData = await geoRes.json()
         if (geoData && geoData.status === 'success') {
           country = geoData.country || country
           city = geoData.city || city
           isp = geoData.isp || isp
         }
       }
     } catch (e) {
       console.log('Geo IP Lookup failed silently')
     }
     
     // Parse User Agent strings robustly
     const uaString = req.headers.get('user-agent') || ''
     const { device, browser, os } = parseUserAgent(uaString)

     // 1. Ingest precisely into Prisma DB logging
     const visit = await prisma.siteVisit.create({
       data: {
          ipHash: hashedIp,
          country,
          city,
          source: source || 'Direct',
          device,
          browser,
          os,
          path: path || '/',
          details: details || `Standard HTTP Hit - ISP: ${isp}`
       }
     })

     // 2. Alert the Admin transparently through Telegram Webhooks!
     // We only alert on new IP signatures to prevent spam. (i.e. if this hashed IP hasn't visited today)
     const today = new Date()
     today.setHours(0,0,0,0)
     const visitsToday = await prisma.siteVisit.count({
        where: { ipHash: hashedIp, createdAt: { gte: today } }
     })

     if (visitsToday === 1) { // It's their first time hitting the servers today!
        await NotificationService.sendAdminAlert(
           "NEW TARGET LOCK (Website Hit) 🌐",
           `📍 *Location:* ${city}, ${country}\n🏢 *ISP/Carrier:* ${isp}\n\n💻 *Device Stack:* ${os} | ${browser} (${device})\n🎯 *Entry Path:* \`${path || '/'}\`\n🔗 *Traffic Source:* ${source || 'Direct Traffic'}`,
           "A fresh target has successfully landed on your domain properties right now. All system telemetry sensors are active and logging."
        )
     }

     return NextResponse.json({ success: true, trackingId: visit.id })

  } catch (error) {
     console.error("Telemetry Tracker Error:", error)
     // Return 200 OK so that tracking errors never disrupt the frontend user experience.
     return NextResponse.json({ success: false, error: "Dropped telemetry packet" })
  }
}
