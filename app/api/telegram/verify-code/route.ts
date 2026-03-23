import { NextRequest, NextResponse } from "next/server"
import { getPendingClient, removePendingClient } from "@/lib/telegram"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { StringSession } from "telegram/sessions"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { phone, code, phoneCodeHash, password } = await req.json()

  if (!phone || !code || !phoneCodeHash) {
    return NextResponse.json({ error: "Required fields missing" }, { status: 400 })
  }

  try {
    const pendingData = getPendingClient(phone)
    if (!pendingData) {
      return NextResponse.json({ error: "Session not found. Try sending the code again." }, { status: 404 })
    }
    
    const { client, apiId, apiHash } = pendingData;

    try {
      await client.start({
        phoneNumber: async () => phone,
        phoneCode: async () => code,
        password: async () => password || "",
        onError: async (err: Error) => {
          console.error("Sign-in error:", err)
          return true
        },
      })
    } catch (signInError: any) {
      if (signInError.message?.includes("SESSION_PASSWORD_NEEDED")) {
        return NextResponse.json({ success: false, requires2FA: true })
      }
      throw signInError
    }

    const sessionString = (client.session as StringSession).save()
    
    // Save account to DB
    const me = await client.getMe()
    const telegramAccount = await prisma.telegramAccount.upsert({
      where: { phone },
      update: {
        session: sessionString,
        status: "ACTIVE",
        name: me.firstName + (me.lastName ? ` ${me.lastName}` : ""),
        username: me.username || null,
        apiId: String(apiId),
        apiHash: apiHash,
        userId: session.user.id,
      },
      create: {
        phone,
        session: sessionString,
        status: "ACTIVE",
        name: me.firstName + (me.lastName ? ` ${me.lastName}` : ""),
        username: me.username || null,
        apiId: String(apiId),
        apiHash: apiHash,
        userId: session.user.id,
      },
    })

    removePendingClient(phone)
    await client.disconnect()

    return NextResponse.json({ success: true, account: telegramAccount })
  } catch (error: any) {
    console.error("Verify code error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
