'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Plus, Trash2, Search, Users, ShieldAlert, CheckCircle, Smartphone, Rocket, BoxSelect, Loader2, Database, Activity, Download, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { toast } from 'sonner';

interface Member {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  telegramId: string;
  is_bot: boolean;
  createdAt: string;
  status: string;
  campaign?: { name: string };
  sourceGroupId?: string;
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function MembersPage() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const [members, setMembers] = useState<Member[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCampaignFilter, setSelectedCampaignFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(100);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Scrape State
  const [isScrapeOpen, setIsScrapeOpen] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeTarget, setScrapeTarget] = useState('');
  const [scrapeAccount, setScrapeAccount] = useState('');
  const [scrapeStatusText, setScrapeStatusText] = useState('Idle');
  const [scrapeCount, setScrapeCount] = useState(0);
  const [accounts, setAccounts] = useState<any[]>([]);

  // Manual Member State
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ 
    username: '', 
    firstName: '', 
    lastName: '',
    targetCampaignId: '' 
  });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset to page 1 on new search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (status === 'authenticated' && user?.id) {
      fetchData();
      setSelectedIds(new Set());
    }
  }, [status, user?.id, debouncedSearch, selectedCampaignFilter, statusFilter, page, limit]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchAccounts();
      fetchCampaigns();
    }
  }, [status]);

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/telegram/accounts');
      if (response.ok) {
        const data = await response.json();
        setAccounts(data.filter((a: any) => a.status === 'ACTIVE'));
      }
    } catch {}
  };

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
      
      if (selectedCampaignFilter !== 'ALL') params.append('campaignId', selectedCampaignFilter);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (debouncedSearch) params.append('search', debouncedSearch);

      const res = await fetch(`/api/members?${params.toString()}`);
      if (res.ok) {
        const result = await res.json();
        setMembers(result.data);
        setMeta(result.meta);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch members data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.targetCampaignId) {
       toast.error('Please assign this target to a specific Campaign first!');
       return;
    }
    if (!formData.username && !formData.firstName) {
       toast.error('Please provide at least a username or a first name.');
       return;
    }
    
    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: formData.username,
          firstName: formData.firstName,
          lastName: formData.lastName,
          campaignId: formData.targetCampaignId 
        }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request Failed');
      
      toast.success('Manual target successfully registered!');
      setShowForm(false);
      setFormData({ username: '', firstName: '', lastName: '', targetCampaignId: '' });
      fetchData(); 
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteMember = async (id: string, isAll = false) => {
    try {
      let url = `/api/members?id=${id}`;
      if (isAll) {
        if (!confirm("Are you incredibly sure you want to delete ALL targets matching the current filter? This cannot be undone.")) return;
        url = `/api/members?deleteAll=true&campaignId=${selectedCampaignFilter}`;
      }
      
      const res = await fetch(url, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success(isAll ? `Bulk deleted ${data.count} targets` : 'Target securely removed');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete data');
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Are you absolutely sure you want to permanently delete the ${selectedIds.size} selected targets?`)) return;
    
    try {
      const url = `/api/members?ids=${JSON.stringify(Array.from(selectedIds))}`;
      const res = await fetch(url, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success(`Success! Deleted ${data.count} targets from the database.`);
      setSelectedIds(new Set());
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete selected targets');
    }
  };

  const handleStartScrape = async () => {
    if (!scrapeTarget) return toast.error('Please provide a target group username or link');
    if (!scrapeAccount) return toast.error('Please select an active Telegram session to use');

    setIsScraping(true);
    setScrapeCount(0);
    setScrapeStatusText('Initializing connection to Telegram servers...');
    
    try {
      const res = await fetch('/api/telegram/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId: scrapeTarget, accountId: scrapeAccount })
      });

      if (!res.ok) {
        let errData = { error: 'Failed to start scraping' };
        try { errData = await res.json(); } catch(e){}
        throw new Error(errData.error || 'Failed to start scraping');
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No streaming body returned');
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            if (!dataStr) continue;
            
            try {
              const data = JSON.parse(dataStr);
              if (data.status === 'Error') {
                toast.error(data.error || 'Extraction encountered a failure', { duration: 8000 });
                setScrapeStatusText(`Error: ${data.error}`);
                setIsScraping(false);
                return;
              } else if (data.status === 'Scraping') {
                setScrapeCount(data.count);
                setScrapeStatusText(`Extracted ${data.count} targets continuously...`);
              } else if (data.status === 'Finished') {
                toast.success('Extraction Complete! All targets secured.');
                setScrapeStatusText('Finished');
                setTimeout(() => { setIsScrapeOpen(false); fetchData(); }, 2000);
              } else {
                setScrapeStatusText(data.status);
              }
            } catch (e) {
              // Ignore partial chunk parse error
            }
          }
        }
      }

    } catch (err: any) {
      toast.error(err.message, { duration: 8000 });
      setScrapeStatusText('Failed');
    } finally {
      setIsScraping(false);
      fetchData(); 
    }
  };

  const exportToTxt = () => {
    if (members.length === 0) return toast.error('No targets available in the current view to export.');
    
    // Prioritize username, fallback to pure telegramId string
    const dataString = members
      .map(m => m.username ? `@${m.username}` : m.telegramId)
      .join('\n');
      
    const blob = new Blob([dataString], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads_export_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success(`Exported ${members.length} targets to TXT file.`);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header & Tools Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Lead Database</h1>
          <p className="text-slate-400 mt-1">Manage scraped targets, manual insertions, and export leads for active campaigns</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={exportToTxt}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 shadow-md transition-all h-10 px-4"
          >
            <Download className="w-4 h-4 mr-2 text-slate-400" />
            Export to TXT
          </Button>
          <Button
            onClick={() => { setIsScrapeOpen(true); setScrapeStatusText('Idle'); setScrapeCount(0); }}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white shadow-lg shadow-black/20 transition-all font-medium h-10 px-5"
          >
            <Database className="w-4 h-4 mr-2 text-cyan-400" />
            Auto-Scrape Target Group
          </Button>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-linear-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-900/20 hover:shadow-purple-900/40 transition-all border border-purple-500/50 font-medium h-10 px-5"
          >
            {showForm ? 'Cancel Registration' : <><Plus className="w-5 h-5 mr-1.5" /> Manual Lead</>}
          </Button>
        </div>
      </div>

      {/* Scrape Modal */}
      <Dialog open={isScrapeOpen} onOpenChange={(open) => { if (!isScraping) setIsScrapeOpen(open) }}>
        <DialogContent className="sm:max-w-xl bg-slate-900 border-slate-800 text-white shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <BoxSelect className="w-5 h-5 text-cyan-400" />
              Automated Group Extraction
            </DialogTitle>
            <DialogDescription className="text-slate-400 pt-1">
              Extract members from target groups safely utilizing anti-ban jittering.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Target Group Link / Username</label>
              <Input
                placeholder="e.g., https://t.me/CryptoWhales or CryptoWhales"
                value={scrapeTarget}
                onChange={(e) => setScrapeTarget(e.target.value)}
                disabled={isScraping}
                className="bg-slate-950 border-slate-800 text-white focus:ring-cyan-500 h-11"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Scraper Identity</label>
              <select
                value={scrapeAccount}
                onChange={(e) => setScrapeAccount(e.target.value)}
                disabled={isScraping}
                className="w-full px-4 h-11 bg-slate-950 border border-slate-800 text-white rounded-md focus:ring-2 focus:ring-cyan-500 outline-none appearance-none"
              >
                <option value="">Select an active secure session</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name || acc.phone}</option>
                ))}
              </select>
            </div>
            
            {/* Live Progress Tracker */}
            {isScraping || scrapeStatusText !== 'Idle' ? (
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-center justify-between shadow-inner">
                 <div className="flex items-center gap-3">
                   {isScraping ? <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" /> : 
                     scrapeStatusText === 'Finished' ? <CheckCircle className="w-5 h-5 text-green-400" /> : 
                     scrapeStatusText.startsWith('Error') ? <ShieldAlert className="w-5 h-5 text-red-400" /> :
                     <Activity className="w-5 h-5 text-slate-500" />
                   }
                   <div>
                     <p className="text-sm font-semibold text-white tracking-wide">{scrapeStatusText}</p>
                     {isScraping && <p className="text-xs text-slate-400 mt-0.5">Scraping in progress, please keep window open...</p>}
                   </div>
                 </div>
                 {scrapeCount > 0 && (
                   <div className="text-right">
                     <p className="text-2xl font-black text-cyan-400">{scrapeCount}</p>
                     <p className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Members</p>
                   </div>
                 )}
              </div>
            ) : (
              <div className="bg-cyan-500/10 border border-cyan-500/20 p-4 rounded-lg flex gap-3 text-sm text-cyan-300 shadow-inner">
                 <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                 <p className="leading-relaxed">
                   <strong className="text-white">Anti-Ban Enabled:</strong> Extraction will chunk records globally and introduce artificial Delays (Jittering) to guarantee account isolation. 
                 </p>
              </div>
             )}

            <Button 
                onClick={handleStartScrape} 
                className={`w-full h-11 shadow-lg font-medium transition-all ${isScraping ? 'bg-slate-800 text-slate-400' : 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-cyan-900/50'}`}
                disabled={isScraping}
              >
                {isScraping ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Rocket className="w-4 h-4 mr-2" />}
                {isScraping ? "Live Extraction Running..." : "Execute Silent Scrape"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manual Addition Form */}
      {showForm && (
        <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
          <CardHeader>
            <CardTitle className="text-lg text-white">Manual Target Registration</CardTitle>
            <CardDescription className="text-slate-400">Add a specific username to funnel into a campaign manually.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddMember} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                 <div className="space-y-2">
                   <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Assign to Campaign *</label>
                   <select
                     value={formData.targetCampaignId}
                     onChange={(e) => setFormData({ ...formData, targetCampaignId: e.target.value })}
                     className="w-full h-10 px-3 bg-slate-950 border border-slate-800 text-white rounded-md focus:ring-2 focus:ring-purple-500 outline-none appearance-none"
                     required
                   >
                     <option value="" disabled>-- Select a Campaign --</option>
                     {campaigns.map(c => (
                       <option key={c.id} value={c.id}>{c.name}</option>
                     ))}
                   </select>
                 </div>
                 <div className="space-y-2">
                   <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Username (without @)</label>
                   <Input
                     placeholder="e.g. durov"
                     value={formData.username}
                     onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                     className="bg-slate-950 border-slate-800 text-white focus:ring-purple-500 h-10"
                   />
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">First Name</label>
                  <Input
                    placeholder="Pavel"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="bg-slate-950 border-slate-800 text-white focus:ring-purple-500 h-10"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Last Name</label>
                  <Input
                    placeholder="Durov"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="bg-slate-950 border-slate-800 text-white focus:ring-purple-500 h-10"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-slate-800/50">
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white px-8 shadow-lg shadow-purple-900/20">
                  Register Lead
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Main Table Area */}
      <Card className="bg-slate-900 border-slate-800 shadow-2xl overflow-hidden flex flex-col relative">
        {/* Table Advanced Filters */}
        <div className="p-4 border-b border-slate-800 bg-slate-900 flex flex-col lg:flex-row gap-4 lg:items-center z-20">
          
          <div className="flex-1 w-full relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-purple-400 transition-colors" />
            <Input
              placeholder="Filter leads by username, ID, or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 pl-10 focus:ring-purple-500 transition-all w-full h-10"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 lg:w-max">
            <div className="relative w-full sm:w-48">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-4 h-10 bg-slate-950 border border-slate-800 text-slate-300 text-sm rounded-md focus:ring-2 focus:ring-purple-500 outline-none appearance-none cursor-pointer"
              >
                <option value="ALL">Any Status</option>
                <option value="UNCHECKED">Standby (Unchecked)</option>
                <option value="SENT">Dispatched (Sent)</option>
                <option value="FAILED">Blocked (Failed)</option>
              </select>
            </div>

            <div className="relative w-full sm:w-56">
              <select
                value={selectedCampaignFilter}
                onChange={(e) => { setSelectedCampaignFilter(e.target.value); setPage(1); }}
                className="w-full px-4 h-10 bg-slate-950 border border-slate-800 text-slate-300 text-sm rounded-md focus:ring-2 focus:ring-purple-500 outline-none appearance-none cursor-pointer"
              >
                <option value="ALL">All Associated Campaigns</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            
            {selectedIds.size > 0 && (
               <Button
                 variant="destructive"
                 onClick={handleDeleteSelected}
                 className="bg-red-600 hover:bg-red-700 text-white shadow-lg h-10 px-4"
               >
                 <Trash2 className="w-4 h-4 mr-2" /> Delete {selectedIds.size} Selected
               </Button>
            )}
            
            <Button
              variant="outline"
              onClick={() => handleDeleteMember("ALL", true)}
              className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 h-10"
              title="Delete all matching current filter"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <CardContent className="p-0 flex-1 relative min-h-[400px]">
          {loading && (
            <div className="absolute inset-0 z-30 bg-slate-900/40 backdrop-blur-[1px] flex justify-center items-center">
              <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
          )}
          
          {members.length === 0 && !loading ? (
             <div className="flex flex-col items-center justify-center py-32 text-center">
                <div className="w-24 h-24 rounded-full bg-slate-800/30 flex items-center justify-center mb-6 border border-slate-700/30 shadow-inner">
                  <Database className="w-10 h-10 text-cyan-500/50" />
                </div>
                <p className="text-2xl font-bold text-white mb-3 tracking-tight">No Targets Found</p>
                <p className="text-slate-400 text-base max-w-md mx-auto mb-8">Adjust your filters or initiate a group extraction to populate the database.</p>
                <Button onClick={() => setIsScrapeOpen(true)} className="bg-slate-800 hover:bg-slate-700 text-white shadow-xl h-11 px-6">
                  Initialize Scrape Engine
                </Button>
              </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left relative">
                <thead className="sticky top-0 bg-slate-900 text-slate-400 font-medium border-b border-slate-800 z-10">
                  <tr>
                    <th className="px-6 py-4 w-[50px]">
                      <input 
                        type="checkbox" 
                        checked={members.length > 0 && selectedIds.size === members.length}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedIds(new Set(members.map(m => m.id)));
                          else setSelectedIds(new Set());
                        }}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-purple-500 focus:ring-purple-500 focus:ring-offset-slate-900 cursor-pointer"
                      />
                    </th>
                    <th className="px-6 py-4">Target Identity</th>
                    <th className="px-6 py-4">Source Origin</th>
                    <th className="px-6 py-4">Assigned Task</th>
                    <th className="px-6 py-4">System Tag</th>
                    <th className="px-6 py-4">State</th>
                    <th className="px-6 py-4 text-right">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {members.map((member) => (
                    <tr key={member.id} className={`hover:bg-slate-800/30 transition-colors group ${selectedIds.has(member.id) ? 'bg-purple-500/5' : ''}`}>
                      <td className="px-6 py-4 w-[50px]">
                        <input 
                          type="checkbox" 
                          checked={selectedIds.has(member.id)}
                          onChange={(e) => {
                            const newSet = new Set(selectedIds);
                            if (e.target.checked) newSet.add(member.id);
                            else newSet.delete(member.id);
                            setSelectedIds(newSet);
                          }}
                          className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-purple-500 focus:ring-purple-500 focus:ring-offset-slate-900 cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-slate-300 font-bold shrink-0 shadow-inner">
                            {member.firstName?.charAt(0) || member.username?.charAt(0) || '?'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-white truncate max-w-[200px]">{member.firstName} {member.lastName}</p>
                            <p className="text-xs text-slate-400 font-mono truncate max-w-[200px] mt-0.5">
                              {member.username ? `@${member.username}` : `[ID: ${member.telegramId}]`}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                         {member.sourceGroupId ? (
                            <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-md shadow-sm">
                              {member.sourceGroupId}
                            </span>
                         ) : (
                            <span className="text-xs text-slate-500 italic">Manual Input</span>
                         )}
                      </td>
                      <td className="px-6 py-4">
                        {member.campaign?.name ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 shadow-sm">
                            <Rocket className="w-3.5 h-3.5 text-purple-400" />
                            {member.campaign.name}
                          </span>
                        ) : (
                          <span className="text-slate-600 italic text-xs">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px] bg-slate-950 border border-slate-800 px-2.5 py-1.5 rounded-md w-fit shadow-sm">
                          <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                          {member.telegramId}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {member.status === 'SENT' ? (
                          <span className="inline-flex items-center gap-1.5 text-green-400 text-[10px] font-bold px-2 py-1 rounded bg-green-500/10 border border-green-500/20 uppercase tracking-widest shadow-sm">
                            <CheckCircle className="w-3 h-3" /> Dispatched
                          </span>
                        ) : member.status === 'FAILED' ? (
                          <span className="inline-flex items-center gap-1.5 text-red-400 text-[10px] font-bold px-2 py-1 rounded bg-red-500/10 border border-red-500/20 uppercase tracking-widest shadow-sm">
                            <ShieldAlert className="w-3 h-3" /> Blocked
                          </span>
                        ) : member.status === 'UNCHECKED' ? (
                          <span className="inline-flex items-center gap-1.5 text-amber-500 text-[10px] font-bold px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20 uppercase tracking-widest shadow-sm">
                            Standby
                          </span>
                        ) : (
                           <span className="text-slate-400 text-[10px] uppercase">{member.status}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          onClick={() => handleDeleteMember(member.id)}
                          size="icon"
                          variant="ghost"
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-red-400 hover:bg-red-500/10 h-8 w-8"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>

        {/* Professional Pagination Footer */}
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
              <span>of <strong>{meta.total}</strong> targets</span>
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
