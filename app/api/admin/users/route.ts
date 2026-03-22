import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import bcrypt from "bcryptjs"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
     const users = await prisma.user.findMany({
       select: { id: true, name: true, email: true, username: true, role: true, createdAt: true },
       orderBy: { createdAt: 'desc' }
     })
     return NextResponse.json(users)
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
     const { email, password, username, role, name } = await req.json()
     if (!email || !password || !role) {
       return NextResponse.json({ error: "Email, password, and role are required." }, { status: 400 })
     }

     const hashedPassword = await bcrypt.hash(password, 10)

     const newUser = await prisma.user.create({
       data: {
          email,
          username,
          password: hashedPassword,
          role,
          name: name || (username || email).split('@')[0]
       },
       select: { id: true, email: true, role: true }
     })

     return NextResponse.json({ success: true, user: newUser })
  } catch (error: any) {
     if (error.code === 'P2002') {
         return NextResponse.json({ error: "A user with that email or username already exists." }, { status: 400 })
     }
     return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
     const { searchParams } = new URL(req.url)
     const id = searchParams.get('id')

     if (!id) return NextResponse.json({ error: "User ID required" }, { status: 400 })
     if (id === session.user.id) return NextResponse.json({ error: "Cannot delete your own active session." }, { status: 400 })

     await prisma.user.delete({ where: { id } })

     return NextResponse.json({ success: true })
  } catch (error: any) {
     return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
