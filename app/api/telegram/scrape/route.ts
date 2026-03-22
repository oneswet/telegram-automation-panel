import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { TelegramService } from "@/lib/services/telegram.service"

export const maxDuration = 300; // Set Vercel execution limit up to 5 minutes to support long scrapes

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { groupId, accountId } = await req.json()

  if (!groupId || !accountId) {
    return NextResponse.json(
      { error: "Target Group Link/ID and an executing Account ID are required." },
      { status: 400 }
    )
  }

  // Create an SSE (Server-Sent Events) readable stream
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const sendJSON = (payload: any) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`))
        }

        sendJSON({ status: "Connecting to Telegram and fetching group..." })

        await TelegramService.scrapeMembers(
          accountId, 
          groupId, 
          session.user.id, 
          (progressCount) => {
            sendJSON({ status: "Scraping", count: progressCount })
          }
        )

        sendJSON({ status: "Finished" })
      } catch (error: any) {
        console.error("Initiate scrape streaming error:", error)
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: "Error", error: error.message || "Failed to parse group" })}\n\n`))
      } finally {
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  })
}
