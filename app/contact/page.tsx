'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Send, MessageSquare } from 'lucide-react'
import Link from 'next/link'

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!res.ok) throw new Error("Failed to send message")

      toast.success("Message dispatched securely!")
      setFormData({ name: '', email: '', subject: '', message: '' })
    } catch (error) {
      toast.error("Failed to send. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-indigo-950 via-slate-900 to-blue-950 px-4 py-12 relative overflow-hidden">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-2xl relative z-10">
        <Link 
          href="/login" 
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-300 hover:text-white transition-colors mb-6"
        >
          &larr; Back to Portal
        </Link>
        
        <Card className="border-slate-700/50 shadow-2xl bg-slate-900/60 backdrop-blur-xl">
          <CardHeader className="space-y-4 pb-8 text-center pt-10">
            <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-linear-to-tr from-[#24A1DE] to-[#1f86bb] shadow-[0_0_30px_rgba(36,161,222,0.4)] mx-auto mb-2">
               <MessageSquare className="w-8 h-8 text-white" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-4xl font-extrabold text-white tracking-tight">
                Secure Contact
              </CardTitle>
              <CardDescription className="text-slate-300 font-medium text-lg max-w-md mx-auto">
                Send a direct priority dispatch to our administrative team.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="px-8 pb-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2.5">
                  <label htmlFor="name" className="text-xs font-bold text-white tracking-wider uppercase">
                    Full Name
                  </label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={isLoading}
                    className="h-12 bg-slate-950/50 border-slate-700 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-[#24A1DE]/50 focus:border-[#24A1DE] transition-all"
                    required
                  />
                </div>

                <div className="space-y-2.5">
                  <label htmlFor="email" className="text-xs font-bold text-white tracking-wider uppercase">
                    Email Address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={isLoading}
                    className="h-12 bg-slate-950/50 border-slate-700 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-[#24A1DE]/50 focus:border-[#24A1DE] transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <label htmlFor="subject" className="text-xs font-bold text-white tracking-wider uppercase">
                  Subject Line
                </label>
                <Input
                  id="subject"
                  placeholder="How can we help you?"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  disabled={isLoading}
                  className="h-12 bg-slate-950/50 border-slate-700 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-[#24A1DE]/50 focus:border-[#24A1DE] transition-all"
                  required
                />
              </div>

              <div className="space-y-2.5">
                <label htmlFor="message" className="text-xs font-bold text-white tracking-wider uppercase">
                  Message Content
                </label>
                <Textarea
                  id="message"
                  placeholder="Type your secure message here..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  disabled={isLoading}
                  className="min-h-[150px] resize-none bg-slate-950/50 border-slate-700 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-[#24A1DE]/50 focus:border-[#24A1DE] transition-all p-4"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 mt-6 bg-linear-to-r from-[#24A1DE] to-[#1a8bc4] hover:from-[#1f86bb] hover:to-[#1777a8] text-white font-bold text-lg shadow-[0_0_20px_rgba(36,161,222,0.3)] hover:shadow-[0_0_25px_rgba(36,161,222,0.5)] transition-all rounded-xl flex items-center justify-center gap-3"
              >
                {isLoading ? (
                  <span className="flex items-center gap-3">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Dispatching...
                  </span>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Dispatch Secure Message
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
