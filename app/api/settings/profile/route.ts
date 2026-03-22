import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import bcrypt from "bcryptjs"

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
     const { email, password, username } = await req.json()
     
     const dataToUpdate: any = {}
     if (email) dataToUpdate.email = email
     if (username) dataToUpdate.username = username
     if (password) {
        dataToUpdate.password = await bcrypt.hash(password, 10)
     }

     const user = await prisma.user.update({
        where: { id: session.user.id },
        data: dataToUpdate
     })

     return NextResponse.json({ success: true, message: "Profile credentials updated successfully" })
  } catch (error: any) {
     if (error.code === 'P2002') {
         return NextResponse.json({ error: "Email or Username already exists" }, { status: 400 })
     }
     return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
