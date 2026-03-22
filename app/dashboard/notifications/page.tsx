'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Bell, Save, Zap, KeyRound, Smartphone, ShieldAlert, CheckCircle, HelpCircle, Activity, Settings, Radar, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface NotifLog {
  id: string;
  type: string;
  content: string;
  recipient: string;
  status: string;
  createdAt: string;
}

export default function NotificationsDashboard() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<NotifLog[]>([]);
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      fetchConfig();
      fetchLogs();
    }
  }, [status, session]);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.TELEGRAM_NOTIFY_BOT_TOKEN) setBotToken(data.TELEGRAM_NOTIFY_BOT_TOKEN);
        if (data.TELEGRAM_NOTIFY_CHAT_ID) setChatId(data.TELEGRAM_NOTIFY_CHAT_ID);
      }
    } catch {} 
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/notifications/logs');
      if (res.ok) setLogs(await res.json());
    } catch {} finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const loadingToast = toast.loading('Securing Bot framework settings...');
    try {
      const payload = {
         TELEGRAM_NOTIFY_BOT_TOKEN: botToken.trim(),
         TELEGRAM_NOTIFY_CHAT_ID: chatId.trim()
      };
      const res = await fetch('/api/settings', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(data.message || 'System configuration successfully overridden.', { id: loadingToast });
    } catch (error: any) {
      toast.error(error.message, { id: loadingToast });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestPing = async () => {
    if (!botToken || !chatId) return toast.error('You must save a valid Bot Token and Chat ID before deploying a test ping.');
    setIsTesting(true);
    const loadId = toast.loading('Dispatching test packet to Telegram...');
    try {
       const res = await fetch('/api/notifications/test', { method: 'POST' });
       const data = await res.json();
       if (!res.ok) throw new Error(data.error);

       toast.success(data.message, { id: loadId, duration: 8000 });
       fetchLogs();
    } catch (error: any) {
       toast.error(error.message, { id: loadId, duration: 8000 });
    } finally {
       setIsTesting(false);
    }
  };

  const handleAutoDetect = async () => {
    if (!botToken) return toast.error('Enter and save your Bot Token first.');
    
    // First, save the bot token
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ TELEGRAM_NOTIFY_BOT_TOKEN: botToken.trim() })
    });

    setIsDetecting(true);
    const loadId = toast.loading('Scanning bot inbox for your /start message...');
    try {
       const res = await fetch('/api/notifications/test');
       const data = await res.json();
       
       if (data.chats && data.chats.length > 0) {
         const chat = data.chats[0];
         setChatId(chat.chatId);
         
         // Auto-save the detected Chat ID
         await fetch('/api/settings', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ TELEGRAM_NOTIFY_CHAT_ID: chat.chatId })
         });
         
         toast.success(`Chat ID detected and saved! Found: ${chat.name} (${chat.chatId})`, { id: loadId, duration: 8000 });
       } else {
         toast.error('No conversations found. Open Telegram → find your bot → send /start → then click detect again.', { id: loadId, duration: 10000 });
       }
    } catch (error: any) {
       toast.error(error.message, { id: loadId, duration: 8000 });
    } finally {
       setIsDetecting(false);
    }
  };

  if (status === 'loading') return <div className="min-h-[500px] flex items-center justify-center"><Activity className="w-10 h-10 text-indigo-500 animate-spin" /></div>;
  
  if (session?.user?.role !== 'ADMIN') {
    return (
       <div className="py-20 text-center">
          <h1 className="text-2xl font-bold text-red-400">Classified Access</h1>
          <p className="text-slate-400 mt-2">Only system administrators can intercept real-time server webhooks.</p>
       </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
             <Bell className="w-8 h-8 text-indigo-500" /> Administrative Radar
          </h1>
          <p className="text-slate-400 mt-1">Bind your personal Telegram Bot to receive stealth alerts on targets, extraction drops, and core faults.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Config Panel */}
         <Card className="bg-slate-900 border-slate-800 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl -mr-6 -mt-6" />
            <CardHeader className="border-b border-slate-800/80 bg-slate-950/30">
               <CardTitle className="text-lg text-white font-bold flex items-center gap-2">
                 <Settings className="w-5 h-5 text-indigo-400" /> Telegram Integration Node
               </CardTitle>
               <CardDescription className="text-slate-400">
                  You can generate a bot token via @BotFather. This bot will serve exclusively as your private informant.
               </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
               <form onSubmit={handleSave} className="space-y-6">
                 
                 <div className="space-y-2 relative">
                    <label className="text-xs uppercase tracking-widest font-bold text-slate-400 flex items-center gap-1.5 line-clamp-1">
                      <KeyRound className="w-3.5 h-3.5" /> Bot HTTP Access Token
                    </label>
                    <Input 
                      placeholder="e.g. 1234567890:AA...xyz..." 
                      value={botToken}
                      onChange={(e) => setBotToken(e.target.value)}
                      type="password"
                      className="bg-slate-950 border-slate-800 text-white font-mono placeholder:text-slate-600 focus:ring-indigo-500 shadow-inner h-11" 
                    />
                 </div>

                 <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest font-bold text-slate-400 flex justify-between items-center">
                      <span className="flex items-center gap-1.5"><Smartphone className="w-3.5 h-3.5" /> Recipient Chat ID</span>
                    </label>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="e.g. 52319984" 
                        value={chatId}
                        onChange={(e) => setChatId(e.target.value)}
                        className="bg-slate-950 border-slate-800 text-white font-mono placeholder:text-slate-600 focus:ring-indigo-500 shadow-inner h-11 flex-1" 
                      />
                      <Button 
                        type="button" 
                        onClick={handleAutoDetect}
                        disabled={isDetecting || !botToken}
                        className="bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 border border-cyan-500/30 h-11 px-4 shrink-0"
                        title="Auto-detect: saves your Bot Token, then reads recent /start messages to find your Chat ID"
                      >
                        {isDetecting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Radar className="w-4 h-4" />}
                        <span className="ml-1.5 text-xs hidden sm:inline">{isDetecting ? 'Scanning...' : 'Auto-Detect'}</span>
                      </Button>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      <strong className="text-cyan-400">Quick Setup:</strong> 1) Paste Bot Token above → 2) Open Telegram, send <code className="text-indigo-400">/start</code> to your bot → 3) Click <strong>Auto-Detect</strong>
                    </p>
                 </div>

                 <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-800/80">
                    <Button 
                      type="submit" 
                      disabled={isSaving}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-900/50 h-11"
                    >
                       <Save className="w-4 h-4 mr-2" /> {isSaving ? 'Encrypting...' : 'Lock Overrides & Save'}
                    </Button>
                    <Button 
                      type="button"
                      variant="outline"
                      disabled={isTesting || !botToken || !chatId}
                      onClick={handleTestPing}
                      className="flex-1 bg-slate-950 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/10 hover:border-indigo-500/60 h-11"
                    >
                       <Zap className={`w-4 h-4 mr-2 ${isTesting ? 'animate-pulse text-amber-500' : ''}`} /> Fire Test Ping
                    </Button>
                 </div>
               </form>
            </CardContent>
         </Card>

         {/* Dispatch Stats / Status */}
         <div className="space-y-6">
             <div className="bg-slate-900 border border-indigo-500/20 rounded-xl p-6 shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-linear-to-br from-indigo-500/5 to-transparent pointer-events-none" />
                <h3 className="text-sm font-bold tracking-wider text-indigo-400 uppercase mb-4 flex items-center gap-2"><Activity className="w-4 h-4" /> Secure Transmission Grid</h3>
                <div className="space-y-4">
                   <div className="p-4 bg-slate-950/80 rounded-lg border border-slate-800/80 flex items-center justify-between">
                      <div>
                         <p className="text-white font-bold text-sm">Target Tracking (Visits)</p>
                         <p className="text-slate-400 text-xs mt-0.5">Alerts you when a fresh organic IP hits the domain.</p>
                      </div>
                      <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
                   </div>
                   <div className="p-4 bg-slate-950/80 rounded-lg border border-slate-800/80 flex items-center justify-between">
                      <div>
                         <p className="text-white font-bold text-sm">Extraction Pipelines (Scrape)</p>
                         <p className="text-slate-400 text-xs mt-0.5">Notifies completion or fatal bans during group targeting.</p>
                      </div>
                      <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
                   </div>
                   <div className="p-4 bg-slate-950/80 rounded-lg border border-slate-800/80 flex items-center justify-between">
                      <div>
                         <p className="text-white font-bold text-sm">System Faults (Core API)</p>
                         <p className="text-slate-400 text-xs mt-0.5">Immediate 24/7 pings if the backend database goes offline.</p>
                      </div>
                      <div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                   </div>
                </div>
             </div>
         </div>
      </div>

      {/* Internal Webhook Audit Log */}
      <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden">
        <CardHeader className="border-b border-slate-800 bg-slate-950/50">
           <CardTitle className="text-lg text-white">Transmission Audit Logs</CardTitle>
           <CardDescription className="text-slate-400">History of all raw payloads pushed from the server array to Telegram&apos;s data centers.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto min-h-[300px] relative">
             {loading && <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/50 backdrop-blur-[1px]"><Activity className="w-8 h-8 text-indigo-500 animate-spin" /></div>}
             <table className="w-full text-sm text-left">
               <thead className="bg-slate-900 text-slate-400 font-medium border-b border-slate-800 text-xs tracking-wider uppercase">
                 <tr>
                   <th className="px-6 py-4">Timeline</th>
                   <th className="px-6 py-4">Delivery Vector</th>
                   <th className="px-6 py-4">Event Signature</th>
                   <th className="px-6 py-4">Payload Content</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-800/50">
                 {logs.map((log) => (
                   <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                     <td className="px-6 py-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                       {new Date(log.createdAt).toLocaleString()}
                     </td>
                     <td className="px-6 py-4">
                        {log.status === 'DISPATCHED' ? (
                          <span className="inline-flex items-center gap-1.5 text-green-400 text-[10px] font-bold px-2 py-1 rounded bg-green-500/10 border border-green-500/20 uppercase tracking-widest shadow-sm">
                            <CheckCircle className="w-3 h-3" /> Dispatched
                          </span>
                        ) : log.status === 'PENDING' ? (
                          <span className="inline-flex items-center gap-1.5 text-green-400 text-[10px] font-bold px-2 py-1 rounded bg-green-500/10 border border-green-500/20 uppercase tracking-widest shadow-sm">
                            <CheckCircle className="w-3 h-3" /> Dispatched
                          </span>
                        ) : log.status === 'SKIPPED_UNCONFIGURED' ? (
                          <span className="inline-flex items-center gap-1.5 text-amber-500 text-[10px] font-bold px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20 uppercase tracking-widest shadow-sm">
                            <ShieldAlert className="w-3 h-3" /> No Bindings
                          </span>
                        ) : log.status === 'FAILED' ? (
                          <span className="inline-flex items-center gap-1.5 text-red-400 text-[10px] font-bold px-2 py-1 rounded bg-red-500/10 border border-red-500/20 uppercase tracking-widest shadow-sm">
                            <ShieldAlert className="w-3 h-3" /> Failed
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 uppercase font-bold">{log.status}</span>
                        )}
                     </td>
                     <td className="px-6 py-4">
                        <span className="text-white text-xs font-semibold">{log.type}</span>
                     </td>
                     <td className="px-6 py-4">
                        <div className="text-[11px] font-mono text-slate-400 bg-slate-950 p-2 rounded border border-slate-800 line-clamp-2 leading-relaxed" title={log.content}>
                           {log.content}
                        </div>
                     </td>
                   </tr>
                 ))}
                 {logs.length === 0 && !loading && (
                   <tr>
                     <td colSpan={4} className="px-6 py-12 text-center text-slate-500 italic">No webhooks have been transmitted locally yet.</td>
                   </tr>
                 )}
               </tbody>
             </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
