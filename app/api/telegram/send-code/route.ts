import { NextRequest, NextResponse } from "next/server"
import { createTelegramClient, setPendingClient } from "@/lib/telegram"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { phone, apiId, apiHash } = await req.json()

  if (!phone || !apiId || !apiHash) {
    return NextResponse.json({ error: "Phone, API ID, and API Hash are required" }, { status: 400 })
  }

  try {
    const client = createTelegramClient(Number(apiId), apiHash)
    await client.connect()
    
    const { phoneCodeHash } = await client.sendCode(
      {
        apiId: Number(apiId),
        apiHash: apiHash,
      },
      phone
    )

    // Store client and hash in-memory for the verification step
    setPendingClient(phone, client, Number(apiId), apiHash)
    
    return NextResponse.json({ success: true, phoneCodeHash })
  } catch (error: any) {
    console.error("Send code error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
