'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Activity, Zap, Users, ShieldAlert, Smartphone, MessageSquare, CheckCircle2, Clock, Rocket, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  totalAccounts: number;
  activeCampaigns: number;
  totalMembers: number;
  totalMessages: number;
}

interface RecentLog {
  id: string;
  status: string;
  sentAt: string;
  member: { firstName: string | null; lastName: string | null; username: string | null };
  telegramAccount: { name: string | null; phone: string };
  campaign: { name: string };
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<DashboardStats>({
    totalAccounts: 0,
    activeCampaigns: 0,
    totalMembers: 0,
    totalMessages: 0,
  });
  const [recentLogs, setRecentLogs] = useState<RecentLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchDashboardData();
    }
  }, [status]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard/stats');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setStats(data.stats);
      setRecentLogs(data.recentLogs);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-10 w-64 bg-slate-800/50 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-36 bg-slate-800/50 border border-slate-700/50 rounded-2xl" />
          ))}
        </div>
        <div className="h-96 bg-slate-800/50 border border-slate-700/50 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Overview
          </h1>
          <p className="text-slate-200 mt-1 text-sm font-medium">Welcome back, <span className="text-white font-bold">{session?.user?.name || 'Administrator'}</span>. Here is your system performance.</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-900/80 backdrop-blur-md border border-slate-700 shadow-xl rounded-xl">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm font-bold text-white">
            System Online
          </span>
          <div className="w-px h-4 bg-slate-600 mx-1" />
          <span className="text-sm text-slate-200 font-mono font-bold">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Active Identities" 
          value={stats.totalAccounts} 
          icon={<Smartphone className="w-6 h-6 text-blue-400" />}
          description="Provisioned Accounts"
          gradient="from-blue-500/20 to-cyan-500/5"
          border="border-blue-500/30"
        />
        <StatCard 
          title="Running Campaigns" 
          value={stats.activeCampaigns} 
          icon={<Rocket className="w-6 h-6 text-purple-400" />}
          description="Awaiting Execution"
          gradient="from-purple-500/20 to-fuchsia-500/5"
          border="border-purple-500/30"
        />
        <StatCard 
          title="Extracted Targets" 
          value={stats.totalMembers} 
          icon={<Users className="w-6 h-6 text-green-400" />}
          description="Unique Usernames Scraped"
          gradient="from-green-500/20 to-emerald-500/5"
          border="border-green-500/30"
        />
        <StatCard 
          title="Messages Dispatched" 
          value={stats.totalMessages} 
          icon={<MessageSquare className="w-6 h-6 text-orange-400" />}
          description="Successfully Delivered"
          gradient="from-orange-500/20 to-amber-500/5"
          border="border-orange-500/30"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Anti-Ban Status Module */}
        <Card className="lg:col-span-2 bg-slate-900/50 backdrop-blur-xl border-slate-700 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#24A1DE] opacity-10 blur-3xl rounded-full" />
          <CardHeader>
            <CardTitle className="text-xl font-extrabold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#24A1DE]" />
              Anti-Ban Operations Engine
            </CardTitle>
            <CardDescription className="text-slate-200 font-medium text-sm">Telegram protection layer is actively randomizing and parsing rate limits.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-800/60 border border-slate-600/50 p-4 rounded-xl flex items-start gap-4">
                  <div className="p-3 bg-green-500/20 rounded-lg">
                    <ShieldAlert className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm">Account Rotation</h4>
                    <p className="text-xs text-slate-200 mt-1 font-medium">Distributing load across <span className="text-white font-bold">{stats.totalAccounts}</span> active number(s).</p>
                  </div>
                </div>
                <div className="bg-slate-800/60 border border-slate-600/50 p-4 rounded-xl flex items-start gap-4">
                  <div className="p-3 bg-purple-500/20 rounded-lg">
                    <Clock className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm">Behavioral Jitter</h4>
                    <p className="text-xs text-slate-200 mt-1 font-medium">Running artificial human delays globally across all accounts.</p>
                  </div>
                </div>
                <div className="bg-slate-800/60 border border-slate-600/50 p-4 rounded-xl flex items-start gap-4">
                  <div className="p-3 bg-blue-500/20 rounded-lg">
                    <Smartphone className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm">Device Fingerprinting</h4>
                    <p className="text-xs text-slate-200 mt-1 font-medium">Randomized physical device attributes via MTProto API.</p>
                  </div>
                </div>
                <div className="bg-slate-800/60 border border-slate-600/50 p-4 rounded-xl flex items-start gap-4">
                  <div className="p-3 bg-orange-500/20 rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-orange-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm">FloodWait Catching</h4>
                    <p className="text-xs text-slate-200 mt-1 font-medium">Zero process crashing with integrated timeout management.</p>
                  </div>
                </div>
             </div>
             
             <div className="mt-6 pt-6 border-t border-slate-700/50 flex justify-between items-center">
                <p className="text-[13px] text-slate-300 uppercase tracking-widest font-bold flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  Engine Online
                </p>
                <Link href="/dashboard/campaigns" className="text-sm font-bold text-[#24A1DE] hover:text-[#1f86bb] transition-colors flex items-center gap-1">
                  Manage Campaigns &rarr;
                </Link>
             </div>
          </CardContent>
        </Card>

        {/* Recent Message Logs Tracker */}
        <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-700 shadow-2xl flex flex-col">
          <CardHeader className="pb-3 border-b border-slate-700/50">
            <CardTitle className="text-lg font-extrabold text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-green-400" />
                Live Dispatch
              </div>
              <Link href="/dashboard/logs" className="text-xs font-bold text-slate-300 hover:text-white transition-colors">
                View All
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-hidden">
            <div className="divide-y divide-slate-700/50 max-h-[400px] overflow-y-auto">
              {recentLogs && recentLogs.length > 0 ? recentLogs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-slate-800/50 transition-colors flex items-start gap-3 relative group">
                  <div className={`w-8 h-8 rounded-full border border-slate-600/50 shrink-0 flex items-center justify-center ${
                    log.status === 'SENT' ? 'bg-green-500/20' : 'bg-red-500/20'
                  }`}>
                    {log.status === 'SENT' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                    ) : (
                      <ShieldAlert className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white truncate pr-16">
                      @{log.member?.username || log.member?.firstName || 'Unknown Target'}
                    </p>
                    <p className="text-xs font-medium text-slate-300 truncate mt-0.5">
                      via {log.telegramAccount?.name || log.telegramAccount?.phone}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                       <span className="text-[10px] font-mono font-bold text-slate-200 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-600/50">
                         {log.campaign?.name || 'Manual'}
                       </span>
                       <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold group-hover:text-slate-300 transition-colors">
                         {new Date(log.sentAt).toLocaleTimeString([], { hour12: false })}
                       </span>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="py-16 px-4 flex flex-col items-center justify-center text-center">
                   <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center mb-3">
                     <Clock className="w-6 h-6 text-slate-300" />
                   </div>
                   <p className="text-sm font-bold text-white">Listening for dispatches</p>
                   <p className="text-xs font-medium text-slate-300 mt-1 max-w-[200px]">Background worker will push logs here organically.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, description, gradient, border }: any) {
  return (
    <Card className={`bg-slate-900/50 backdrop-blur-xl border-slate-700 hover:${border} transition-all group overflow-hidden relative shadow-xl`}>
      <div className={`absolute inset-0 bg-linear-to-br ${gradient} opacity-70`} />
      <div className="absolute top-4 right-4 p-2 bg-slate-800/80 rounded-xl border border-slate-600/50 shadow-inner group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <CardContent className="pt-6 relative z-10">
        <p className="text-[13px] font-bold text-slate-200 uppercase tracking-wider">{title}</p>
        <div className="mt-3 flex items-end gap-2">
          <h2 className="text-4xl font-extrabold text-white tracking-tighter drop-shadow-sm">
            {value.toLocaleString()}
          </h2>
        </div>
        <p className="text-[13px] font-medium text-slate-300 mt-2">{description}</p>
      </CardContent>
    </Card>
  );
}
