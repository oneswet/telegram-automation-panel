import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

// Brutally force NEXTAUTH_URL to production if it accidentally contains localhost in a live environment
const isLocalhost = process.env.NEXTAUTH_URL?.includes("localhost");
process.env.NEXTAUTH_URL = isLocalhost ? "https://telegramscrape.netlify.app" : (process.env.NEXTAUTH_URL || process.env.URL || "https://telegramscrape.netlify.app");

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
