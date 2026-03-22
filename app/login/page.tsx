'use client'

import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        email: email.trim(),
        password,
        redirect: false,
      })

      if (result?.error) {
        toast.error(result.error || 'Failed to sign in')
        return
      }

      toast.success('Logged in successfully!')
      // Force a full page reload to ensure NextAuth session cookies are hydrated
      window.location.href = '/dashboard'
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-indigo-950 via-slate-900 to-blue-950 px-4 py-8">
      <div className="w-full max-w-md relative z-10">
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl" />
        
        <Card className="border-slate-700/50 shadow-2xl bg-slate-900/60 backdrop-blur-xl relative">
          <CardHeader className="space-y-4 pb-8">
            <div className="flex items-center justify-center h-14 w-14 rounded-xl bg-linear-to-tr from-[#24A1DE] to-[#1f86bb] shadow-[0_0_20px_rgba(36,161,222,0.4)] mx-auto mb-2">
              <svg
                className="h-8 w-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                />
              </svg>
            </div>
            <div className="space-y-1">
              <CardTitle className="text-center text-3xl font-extrabold text-white tracking-tight">
                Telegram Panel
              </CardTitle>
              <CardDescription className="text-center text-slate-300 font-medium text-base">
                Sign in to your account
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2.5">
                <label htmlFor="email" className="text-sm font-bold text-white tracking-wide">
                  EMAIL ADDRESS
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="h-12 bg-slate-950/50 border-slate-700 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-[#24A1DE]/50 focus:border-[#24A1DE] transition-all"
                  required
                />
              </div>

              <div className="space-y-2.5">
                <label htmlFor="password" className="text-sm font-bold text-white tracking-wide">
                  PASSWORD
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="h-12 bg-slate-950/50 border-slate-700 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-[#24A1DE]/50 focus:border-[#24A1DE] transition-all"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 mt-4 bg-linear-to-r from-[#24A1DE] to-[#1a8bc4] hover:from-[#1f86bb] hover:to-[#1777a8] text-white font-bold text-lg shadow-[0_0_20px_rgba(36,161,222,0.3)] hover:shadow-[0_0_25px_rgba(36,161,222,0.5)] transition-all rounded-xl"
              >
                {isLoading ? (
                  <span className="flex items-center gap-3">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Authenticating...
                  </span>
                ) : (
                  'Sign In Securely'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm font-medium text-slate-400">
          <p>Telegram Automation & Campaign Management</p>
        </div>
      </div>
    </div>
  )
}
