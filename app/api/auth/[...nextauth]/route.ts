import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

// Force NEXTAUTH_URL to correct domain on Netlify if user forgot to set it
process.env.NEXTAUTH_URL = process.env.NEXTAUTH_URL || process.env.URL || "https://telegramscrape.netlify.app";

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
