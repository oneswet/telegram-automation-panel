import { NextRequest, NextResponse } from "next/server"
import { NotificationService } from "@/lib/services/notification.service"

export async function POST(req: NextRequest) {
  try {
     const body = await req.json()
     const { name, email, subject, message } = body

     if (!name || !email || !message) {
         return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
     }

     // Parse IP for security context
     const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'Unknown IP'

     // Send a highly professional Telegram Alert
     const dispatchSuccess = await NotificationService.sendAdminAlert(
        "📬 NEW PRIORITY CONTACT REQUEST",
        `👤 *Sender Name:* ${name}\n📧 *Email Address:* ${email}\n🔖 *Subject:* ${subject || 'General Inquiry'}\n🌐 *Sender IP:* \`${ip}\`\n\n✉️ *Message Content:*\n> ${message.split('\n').join('\n> ')}`,
        "This message was dispatched securely from the public contact portal."
     )

     if (!dispatchSuccess) {
         throw new Error("Telegram dispatch failed internally")
     }

     return NextResponse.json({ success: true, message: "Message dispatched securely." })

  } catch (error) {
     console.error("Contact Form Error:", error)
     return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
