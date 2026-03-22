'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, Activity, CheckCircle, ShieldAlert, ChevronLeft, ChevronRight, Filter, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface MessageLog {
  id: string;
  campaignId: string;
  telegramAccountId: string;
  memberId: string;
  status: string;
  errorMessage?: string;
  sentAt: string;
  campaign?: { name: string };
  member?: { username: string; telegramId: string; firstName: string };
  telegramAccount?: { phone: string; name: string };
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function LogsPage() {
  const { data: session, status } = useSession();
  const [logs, setLogs] = useState<MessageLog[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<any[]>([]);

  // Filtering State
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [campaignFilter, setCampaignFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(100);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchCampaigns();
    }
  }, [status]);

  useEffect(() => {
    if (status === 'authenticated') fetchData();
  }, [status, page, limit, statusFilter, campaignFilter, startDate, endDate]);

  const fetchCampaigns = async () => {
    try {
      const campRes = await fetch('/api/campaigns');
      if (campRes.ok) setCampaigns(await campRes.json());
    } catch {}
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (campaignFilter !== 'ALL') params.append('campaignId', campaignFilter);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await fetch(`/api/logs?${params.toString()}`);
      if (res.ok) {
        const result = await res.json();
        setLogs(result.data);
        setMeta(result.meta);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load transmission logs');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    const loadingToast = toast.loading('Generating transmission report...');
    try {
      const params = new URLSearchParams({ export: 'true' });
      if (campaignFilter !== 'ALL') params.append('campaignId', campaignFilter);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await fetch(`/api/logs?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to assemble report');
      const result = await res.json();
      
      const exportData = result.data.map((log: MessageLog) => ({
        Timestamp: new Date(log.sentAt).toLocaleString(),
        Campaign: log.campaign?.name || 'Unknown',
        AccountUsed: log.telegramAccount?.phone || 'Unknown',
        TargetUsername: log.member?.username ? `@${log.member.username}` : `ID:${log.member?.telegramId}`,
        TargetName: log.member?.firstName || '',
        Status: log.status,
        ErrorDetails: log.errorMessage || 'N/A'
      }));

      // Convert to CSV
      const headers = Object.keys(exportData[0] || {}).join(',');
      const csvRows = exportData.map((row: any) => Object.values(row).map(value => `"${String(value).replace(/"/g, '""')}"`).join(','));
      const csvString = [headers, ...csvRows].join('\n');

      const blob = new Blob([csvString], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transmission_report_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Successfully exported ${exportData.length} transmission records to CSV.`, { id: loadingToast });
    } catch (error: any) {
      toast.error(error.message, { id: loadingToast });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Transmission Diagnostics</h1>
          <p className="text-slate-400 mt-1">Audit messaging operations, analyze success rates, and export raw logs</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleExport}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 shadow-md transition-all h-10 px-5"
          >
            <Download className="w-4 h-4 mr-2 text-cyan-400" />
            Generate Expert Report (CSV)
          </Button>
        </div>
      </div>

      <Card className="bg-slate-900 border-slate-800 shadow-2xl overflow-hidden flex flex-col relative">
         <div className="p-4 border-b border-slate-800 bg-slate-900 flex flex-col lg:flex-row gap-4 lg:items-center z-20">
            <div className="flex flex-wrap items-center gap-3 w-full">
              
              <div className="relative w-full sm:w-48">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                  className="w-full pl-9 pr-4 h-10 bg-slate-950 border border-slate-800 text-slate-300 text-sm rounded-md focus:ring-2 focus:ring-purple-500 outline-none appearance-none cursor-pointer"
                >
                  <option value="ALL">All Outcomes</option>
                  <option value="SENT">Delivered Only</option>
                  <option value="FAILED">Failures Only</option>
                </select>
              </div>

              <div className="relative w-full sm:w-56">
                <select
                  value={campaignFilter}
                  onChange={(e) => { setCampaignFilter(e.target.value); setPage(1); }}
                  className="w-full px-4 h-10 bg-slate-950 border border-slate-800 text-slate-300 text-sm rounded-md focus:ring-2 focus:ring-purple-500 outline-none appearance-none cursor-pointer"
                >
                  <option value="ALL">All Associated Campaigns</option>
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                 <div className="relative">
                   <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
                   <Input 
                     type="date" 
                     value={startDate} 
                     onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                     className="bg-slate-950 border-slate-800 text-slate-300 pl-8 h-10 text-xs w-[140px]" 
                   />
                 </div>
                 <span className="text-slate-500 text-sm">to</span>
                 <div className="relative">
                   <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
                   <Input 
                     type="date" 
                     value={endDate} 
                     onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                     className="bg-slate-950 border-slate-800 text-slate-300 pl-8 h-10 text-xs w-[140px]" 
                   />
                 </div>
              </div>
              
              {(statusFilter !== 'ALL' || campaignFilter !== 'ALL' || startDate || endDate) && (
                <Button 
                   variant="ghost" 
                   onClick={() => { setStatusFilter('ALL'); setCampaignFilter('ALL'); setStartDate(''); setEndDate(''); setPage(1); }}
                   className="text-slate-400 hover:text-white text-xs h-10"
                >
                   Clear Filters
                </Button>
              )}
            </div>
         </div>

         <CardContent className="p-0 flex-1 relative min-h-[400px]">
          {loading && (
            <div className="absolute inset-0 z-30 bg-slate-900/40 backdrop-blur-[1px] flex justify-center items-center">
              <Activity className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
          )}
          
          {logs.length === 0 && !loading ? (
             <div className="flex flex-col items-center justify-center py-32 text-center">
                <div className="flex items-center justify-center mb-4">
                  <Activity className="w-12 h-12 text-slate-600/50" />
                </div>
                <p className="text-xl font-bold text-white mb-2">No Diagnosic Logs Available</p>
                <p className="text-slate-400 text-sm max-w-sm">No transmission history matches the current filter constraints.</p>
             </div>
          ) : (
             <div className="overflow-x-auto">
                <table className="w-full text-sm text-left relative">
                  <thead className="sticky top-0 bg-slate-900 text-slate-400 font-medium border-b border-slate-800 z-10 text-xs tracking-wider uppercase">
                    <tr>
                      <th className="px-6 py-4">Timestamp</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Target Identity</th>
                      <th className="px-6 py-4">Origin Campaign</th>
                      <th className="px-6 py-4">Sending Node</th>
                      <th className="px-6 py-4">Diagnostic Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 text-slate-300 whitespace-nowrap font-mono text-[11px]">
                          {new Date(log.sentAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                           {log.status === 'SENT' ? (
                            <span className="inline-flex items-center gap-1.5 text-green-400 text-[10px] font-bold px-2 py-1 rounded bg-green-500/10 border border-green-500/20 uppercase tracking-widest shadow-sm">
                              <CheckCircle className="w-3 h-3" /> Sent
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-red-400 text-[10px] font-bold px-2 py-1 rounded bg-red-500/10 border border-red-500/20 uppercase tracking-widest shadow-sm">
                              <ShieldAlert className="w-3 h-3" /> Failed
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-mono text-cyan-400 text-[11px]">
                           {log.member?.username ? `@${log.member.username}` : `ID: ${log.member?.telegramId}`}
                        </td>
                        <td className="px-6 py-4">
                           <span className="text-slate-300 text-xs font-semibold">{log.campaign?.name || 'Deleted'}</span>
                        </td>
                        <td className="px-6 py-4 text-slate-400 text-xs">
                           {log.telegramAccount?.phone || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 min-w-[200px]">
                           {log.errorMessage ? (
                              <p className="text-[11px] text-red-400/80 font-mono leading-relaxed line-clamp-2" title={log.errorMessage}>{log.errorMessage}</p>
                           ) : (
                              <p className="text-[11px] text-slate-500 italic">200 OK — Delivery Confirmed</p>
                           )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          )}
         </CardContent>

         {/* Pagination Footer */}
        {meta && meta.total > 0 && (
          <div className="bg-slate-900 border-t border-slate-800 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <span>Showing</span>
              <select
                value={limit}
                onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                className="bg-slate-950 border border-slate-800 text-slate-200 rounded px-2 py-1 outline-none appearance-none cursor-pointer"
              >
                <option value={100}>100</option>
                <option value={250}>250</option>
                <option value={500}>500</option>
                <option value={1000}>1000</option>
              </select>
              <span>of <strong>{meta.total}</strong> records</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="bg-slate-950 border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-50 h-8"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Prev
              </Button>
              <div className="px-3 py-1 text-sm font-medium text-slate-300 bg-slate-950 border border-slate-800 rounded-md">
                Page {page} / {meta.totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                disabled={page >= meta.totalPages}
                className="bg-slate-950 border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-50 h-8"
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
