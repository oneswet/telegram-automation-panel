'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Rocket, Play, Pause, Square, AlertCircle, Users, MessageSquare, Send, CheckCircle, Smartphone, Activity, Target, Globe, UserCheck, ChevronDown, Search, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface Campaign {
  id: string;
  name: string;
  description: string;
  messageTemplate: string;
  intervalMin: number;
  intervalMax: number;
  status: string;
  createdAt: string;
  _count: { members: number; messageLogs: number; };
  accounts: { telegramAccountId: string; telegramAccount?: { phone?: string; name?: string; status?: string } }[];
}

interface SourceGroup {
  sourceGroupId: string;
  memberCount: number;
}

interface Member {
  id: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  telegramId: string;
  sourceGroupId: string | null;
  status: string;
}

export default function CampaignsPage() {
  const { status } = useSession();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  
  // UI states
  const [showForm, setShowForm] = useState(false);
  const [telegramAccounts, setTelegramAccounts] = useState<any[]>([]);
  
  // Modals
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [testTarget, setTestTarget] = useState('');
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');

  // Targeting State
  const [sourceGroups, setSourceGroups] = useState<SourceGroup[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [targetMode, setTargetMode] = useState<'groups' | 'members' | 'all' | 'manual'>('groups');
  const [isAssigning, setIsAssigning] = useState(false);
  const [manualUsernames, setManualUsernames] = useState('');

  // Form
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    messageTemplate: '',
    intervalMin: 30,
    intervalMax: 60,
    accounts: [] as string[]
  });

  useEffect(() => {
    if (status === 'authenticated') {
      fetchData();
      fetchAccounts();
      const ref = setInterval(fetchData, 10000);
      return () => clearInterval(ref);
    }
  }, [status]);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/campaigns');
      if (res.ok) setCampaigns(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/telegram/accounts');
      if (res.ok) setTelegramAccounts(await res.json());
    } catch {}
  };

  const fetchSourceGroups = async () => {
    try {
      const res = await fetch('/api/members/groups');
      if (res.ok) setSourceGroups(await res.json());
    } catch {}
  };

  const fetchAllMembers = async () => {
    try {
      const res = await fetch('/api/members?limit=500');
      if (res.ok) {
        const data = await res.json();
        const arr = Array.isArray(data) ? data : (Array.isArray(data.members) ? data.members : []);
        setAllMembers(arr);
      }
    } catch {}
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.accounts.length === 0) return toast.error('You must attach at least one sender account to the campaign.');
    
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success('Campaign initialized perfectly!');
      setShowForm(false);
      setFormData({ name: '', description: '', messageTemplate: '', intervalMin: 30, intervalMax: 60, accounts: [] });
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you strictly sure you want to completely erase this campaign and its sending history?')) return;
    try {
      const res = await fetch(`/api/campaigns?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Campaign permanently deleted');
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      if (newStatus === 'RUNNING') {
         const res = await fetch('/api/telegram/campaign/execute', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ campaignId: id })
         });
         const data = await res.json();
         if (!res.ok) throw new Error(data.error);
         toast.success('Campaign extraction & sending grid engaged!');
      } else {
        const res = await fetch('/api/campaigns', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, status: newStatus }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        toast.success(`Campaign successfully ${newStatus.toLowerCase()}`);
      }
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleTestSend = async () => {
    if(!testTarget) return toast.error('Please specify a target username to send the test message to.');
    if(!selectedAccountId) return toast.error('Please select the testing sender account.');
    const loadingToast = toast.loading('Executing test fire...');

    try {
      const res = await fetch('/api/telegram/campaign/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: selectedCampaignId, targetUsername: testTarget, accountId: selectedAccountId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Test message cleanly injected into Telegram network.', { id: loadingToast });
      setIsTestModalOpen(false);
    } catch (error: any) {
      toast.error(error.message, { id: loadingToast, duration: 8000 });
    }
  };

  const openTargetModal = (campaignId: string) => {
    setSelectedCampaignId(campaignId);
    setSelectedGroups([]);
    setSelectedMembers([]);
    setManualUsernames('');
    setTargetMode('groups');
    setMemberSearch('');
    setIsTargetModalOpen(true);
    fetchSourceGroups();
    fetchAllMembers();
  };

  const handleAssignTargets = async () => {
    setIsAssigning(true);
    const id = toast.loading('Loading targets into campaign payload...');
    try {
      const payload: any = { campaignId: selectedCampaignId, mode: targetMode };
      if (targetMode === 'groups') payload.sourceGroupIds = selectedGroups;
      if (targetMode === 'members') payload.memberIds = selectedMembers;
      if (targetMode === 'manual') {
        const usernames = manualUsernames
          .split(/[\n,;]+/)
          .map(u => u.trim().replace(/^@/, ''))
          .filter(u => u.length > 0);
        if (usernames.length === 0) { toast.error('Enter at least one username.', { id }); setIsAssigning(false); return; }
        payload.usernames = usernames;
      }

      const res = await fetch('/api/campaigns/assign-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(`${data.count} targets successfully loaded into campaign!`, { id, duration: 6000 });
      setIsTargetModalOpen(false);
      setManualUsernames('');
      fetchData();
    } catch (error: any) {
      toast.error(error.message, { id });
    } finally {
      setIsAssigning(false);
    }
  };

  const toggleGroup = (gid: string) => {
    setSelectedGroups(prev => prev.includes(gid) ? prev.filter(g => g !== gid) : [...prev, gid]);
  };

  const toggleMember = (mid: string) => {
    setSelectedMembers(prev => prev.includes(mid) ? prev.filter(m => m !== mid) : [...prev, mid]);
  };

  const filteredMembers = allMembers.filter(m => {
    if (!memberSearch) return true;
    const q = memberSearch.toLowerCase();
    return (m.username?.toLowerCase().includes(q) || m.firstName?.toLowerCase().includes(q) || m.telegramId.includes(q));
  });

  const getStatusConfig = (st: string) => {
    switch(st) {
      case 'RUNNING': return { icon: <Activity className="w-3.5 h-3.5 mr-1.5 animate-pulse" />, color: "text-green-400 bg-green-500/10 border-green-500/20" };
      case 'PAUSED': return { icon: <Pause className="w-3.5 h-3.5 mr-1.5" />, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" };
      case 'COMPLETED': return { icon: <CheckCircle className="w-3.5 h-3.5 mr-1.5" />, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" };
      case 'STOPPED': return { icon: <Square className="w-3.5 h-3.5 mr-1.5" />, color: "text-red-400 bg-red-500/10 border-red-500/20" };
      default: return { icon: <Rocket className="w-3.5 h-3.5 mr-1.5" />, color: "text-slate-400 bg-slate-800/50 border-slate-700/50" };
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Campaign Operations</h1>
          <p className="text-slate-400 mt-1">Configure automated sending waves, assign target groups, and track live conversion loops</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-900/20 transition-all font-medium h-10 px-5"
        >
          {showForm ? 'Cancel Creation' : <><Plus className="w-5 h-5 mr-1.5" /> Initialize Campaign</>}
        </Button>
      </div>

      {/* ===== CREATE CAMPAIGN FORM ===== */}
      {showForm && (
        <Card className="bg-slate-900 border-slate-800 shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 left-0 w-1 h-full bg-linear-to-b from-purple-500 to-indigo-500" />
          <CardHeader>
            <CardTitle className="text-xl text-white">Create Direct Messaging Operation</CardTitle>
            <CardDescription className="text-slate-400">Campaigns funnel targets sequentially to active accounts using strict random jitter intervals.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div className="space-y-4">
                    <div className="space-y-2">
                       <label className="text-xs uppercase tracking-wider font-semibold text-slate-400">Operation Code Name</label>
                       <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. VIP Crypto Presale Wave 1" className="bg-slate-950 border-slate-800 focus:ring-purple-500 text-white h-11" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs uppercase tracking-wider font-semibold text-slate-400">Internal Description</label>
                       <Input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Optional memo..." className="bg-slate-950 border-slate-800 focus:ring-purple-500 text-white h-11" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-xs uppercase tracking-wider font-semibold text-slate-400">Min Delay (s)</label>
                         <Input type="number" min="1" required value={formData.intervalMin} onChange={(e) => setFormData({...formData, intervalMin: Number(e.target.value)})} className="bg-slate-950 border-slate-800 text-white h-11" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-xs uppercase tracking-wider font-semibold text-slate-400">Max Delay (s)</label>
                         <Input type="number" min="1" required value={formData.intervalMax} onChange={(e) => setFormData({...formData, intervalMax: Number(e.target.value)})} className="bg-slate-950 border-slate-800 text-white h-11" />
                      </div>
                    </div>
                 </div>

                 <div className="space-y-4 flex flex-col">
                    <div className="space-y-2 flex-1 flex flex-col">
                      <label className="text-xs uppercase tracking-wider font-semibold text-slate-400 flex justify-between">
                         <span className="flex items-center"><MessageSquare className="w-3.5 h-3.5 mr-1" /> Campaign Payload</span>
                         <span className="text-purple-400 text-[10px] font-mono">Accepts native string formatting</span>
                      </label>
                      <Textarea 
                        required 
                        value={formData.messageTemplate} 
                        onChange={(e) => setFormData({...formData, messageTemplate: e.target.value})} 
                        className="bg-slate-950 border-slate-800 text-white font-mono text-sm leading-relaxed focus:ring-purple-500 resize-none flex-1 min-h-[120px]" 
                        placeholder="Hello, I wanted to formally invite you to our private circle..."
                      />
                    </div>
                 </div>
              </div>

              {/* Bot selection */}
              <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-3">
                 <p className="text-xs tracking-wider uppercase font-bold text-slate-400 flex items-center gap-1.5"><Smartphone className="w-4 h-4"/> Assigned Sender Accounts</p>
                 <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                 {telegramAccounts.map(acc => {
                    const isSelected = formData.accounts.includes(acc.id);
                    return (
                      <div 
                         key={acc.id}
                         onClick={() => setFormData(p => ({ ...p, accounts: isSelected ? p.accounts.filter(id => id !== acc.id) : [...p.accounts, acc.id] }))}
                         className={`p-3 rounded-md cursor-pointer border text-center transition-all ${isSelected ? 'bg-purple-600/20 border-purple-500/50 shadow-inner' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}
                      >
                         <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${acc.status === 'ACTIVE' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`} />
                         <p className={`text-xs font-semibold truncate ${isSelected ? 'text-purple-300' : 'text-slate-400'}`}>{acc.name || acc.phone}</p>
                      </div>
                    )
                 })}
                 {telegramAccounts.length === 0 && <p className="col-span-full text-sm text-slate-500 italic p-2">No active credentials attached yet. Register accounts first.</p>}
                 </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/50">
                 <Button type="button" variant="ghost" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white hover:bg-slate-800">Dismiss</Button>
                 <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white px-8 h-10 shadow-lg font-medium">Initialize Campaign</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* ===== CAMPAIGN GRID ===== */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 relative">
          {loading && <div className="absolute inset-0 z-30 min-h-[400px] flex items-center justify-center"><Activity className="w-8 h-8 text-purple-500 animate-spin" /></div>}
          
          {campaigns.map((campaign) => {
            const statusStyle = getStatusConfig(campaign.status);
            return (
              <Card key={campaign.id} className="bg-slate-900 border-slate-800 shadow-xl flex flex-col overflow-hidden group hover:border-slate-700 transition-colors">
                 <div className="p-5 flex-1">
                    <div className="flex justify-between items-start mb-4">
                       <div>
                         <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors">{campaign.name}</h3>
                         {campaign.description && <p className="text-sm text-slate-400 line-clamp-1 mt-0.5">{campaign.description}</p>}
                       </div>
                       <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black tracking-widest uppercase border ${statusStyle.color}`}>
                         {statusStyle.icon}
                         {campaign.status}
                       </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-slate-950 rounded-md p-3 border border-slate-800/60 shadow-inner">
                         <div className="flex items-center justify-between">
                            <Users className="w-4 h-4 text-cyan-500" />
                            <span className="text-xl font-black text-white">{campaign._count.members}</span>
                         </div>
                         <p className="text-[10px] uppercase font-bold text-slate-500 mt-1 tracking-wider">Targets Locked</p>
                      </div>
                      <div className="bg-slate-950 rounded-md p-3 border border-slate-800/60 shadow-inner">
                         <div className="flex items-center justify-between">
                            <Send className="w-4 h-4 text-purple-500" />
                            <span className="text-xl font-black text-white">{campaign._count.messageLogs}</span>
                         </div>
                         <p className="text-[10px] uppercase font-bold text-slate-500 mt-1 tracking-wider">Payloads Pushed</p>
                      </div>
                    </div>

                    <div className="bg-slate-950 p-4 border-l-2 border-slate-700 rounded-r-md mb-4">
                       <p className="text-xs uppercase font-semibold text-slate-500 tracking-wider mb-2">Attached Template</p>
                       <p className="text-sm text-slate-300 font-mono whitespace-pre-wrap line-clamp-3 leading-relaxed">{campaign.messageTemplate}</p>
                    </div>

                    {/* Sender Accounts chips */}
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {campaign.accounts.map(a => (
                        <span key={a.telegramAccountId} className="text-[10px] font-mono bg-slate-950 border border-slate-800 text-slate-400 px-2 py-0.5 rounded">
                          {a.telegramAccount?.name || a.telegramAccount?.phone || 'Bot'}
                        </span>
                      ))}
                    </div>
                 </div>

                 {/* Action Footer */}
                 <div className="bg-slate-950/50 p-4 border-t border-slate-800 space-y-3">
                    {/* Primary Row: Status actions + Target Assignment */}
                    <div className="grid grid-cols-3 gap-2">
                       {/* Execute / Pause / Resume */}
                       {campaign.status !== 'RUNNING' ? (
                          <Button 
                             onClick={() => handleStatusChange(campaign.id, 'RUNNING')} 
                             className="bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 shadow-sm transition-all text-xs h-9"
                          >
                            <Play className="w-3.5 h-3.5 mr-1.5" /> Execute
                          </Button>
                       ) : (
                          <Button 
                             onClick={() => handleStatusChange(campaign.id, 'PAUSED')} 
                             className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 shadow-sm transition-all text-xs h-9"
                          >
                            <Pause className="w-3.5 h-3.5 mr-1.5" /> Suspend
                          </Button>
                       )}

                       {/* Assign Targets */}
                       <Button 
                         onClick={() => openTargetModal(campaign.id)}
                         className="bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-300 text-xs h-9"
                       >
                         <Target className="w-3.5 h-3.5 mr-1.5" /> Assign Targets
                       </Button>
                       
                       {/* Test Ping */}
                       <Button 
                         variant="outline" 
                         onClick={() => { setSelectedCampaignId(campaign.id); setIsTestModalOpen(true); }}
                         className="bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/20 text-indigo-300 text-xs h-9"
                       >
                         <AlertCircle className="w-3.5 h-3.5 mr-1.5" /> Test Ping
                       </Button>
                    </div>

                    {/* Secondary Row: Stop + Delete */}
                    <div className="flex items-center justify-between">
                       {campaign.status === 'RUNNING' && (
                         <Button 
                            onClick={() => handleStatusChange(campaign.id, 'STOPPED')} 
                            variant="ghost"
                            className="text-red-400 hover:bg-red-500/10 text-xs h-8 px-3"
                         >
                           <Square className="w-3 h-3 mr-1.5" /> Force Stop
                         </Button>
                       )}
                       <div className="flex-1" />
                       <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDelete(campaign.id)} 
                          className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 w-9 h-9"
                       >
                         <Trash2 className="w-4 h-4" />
                       </Button>
                    </div>
                 </div>
              </Card>
            )
          })}
          
          {!loading && campaigns.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-center border border-dashed border-slate-800 rounded-xl bg-slate-900/50">
               <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4"><Rocket className="w-8 h-8 text-slate-500" /></div>
               <p className="text-xl font-bold text-white mb-2">No Active Operation Vectors</p>
               <p className="text-slate-400 text-sm max-w-sm">Use the Initialize button to queue up your first automated message wave.</p>
            </div>
          )}
      </div>

      {/* ===== TARGET ASSIGNMENT MODAL ===== */}
      <Dialog open={isTargetModalOpen} onOpenChange={setIsTargetModalOpen}>
        <DialogContent className="sm:max-w-2xl bg-slate-950 border-slate-800 text-white shadow-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2 text-cyan-400">
               <Target className="w-5 h-5" /> Assign Campaign Targets
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Select how you want to load targets into this campaign. Choose by scraped source group, individual members, or assign all.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={targetMode} onValueChange={(v: any) => setTargetMode(v)} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="bg-slate-900 border border-slate-800 p-1 rounded-lg shrink-0 flex-wrap">
              <TabsTrigger value="groups" className="text-xs data-[state=active]:bg-cyan-600 data-[state=active]:text-white">
                <Globe className="w-3.5 h-3.5 mr-1.5" /> By Source Group
              </TabsTrigger>
              <TabsTrigger value="members" className="text-xs data-[state=active]:bg-cyan-600 data-[state=active]:text-white">
                <UserCheck className="w-3.5 h-3.5 mr-1.5" /> Select Individuals
              </TabsTrigger>
              <TabsTrigger value="manual" className="text-xs data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> Manual Entry
              </TabsTrigger>
              <TabsTrigger value="all" className="text-xs data-[state=active]:bg-cyan-600 data-[state=active]:text-white">
                <Users className="w-3.5 h-3.5 mr-1.5" /> All Members
              </TabsTrigger>
            </TabsList>

            {/* Groups Tab */}
            <TabsContent value="groups" className="flex-1 overflow-y-auto space-y-3 outline-none mt-4">
              <p className="text-xs text-slate-500">Select one or more scraped groups to assign all their members to this campaign:</p>
              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                {sourceGroups.map(g => {
                  const isChecked = selectedGroups.includes(g.sourceGroupId!);
                  return (
                    <div 
                      key={g.sourceGroupId}
                      onClick={() => toggleGroup(g.sourceGroupId!)}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${isChecked ? 'bg-cyan-600/10 border-cyan-500/40 shadow-inner' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${isChecked ? 'bg-cyan-500 border-cyan-500' : 'border-slate-600'}`}>
                        {isChecked && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{g.sourceGroupId}</p>
                      </div>
                      <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded shrink-0">{g.memberCount} targets</span>
                    </div>
                  );
                })}
                {sourceGroups.length === 0 && (
                  <div className="py-10 text-center text-slate-500 italic text-sm">No scraped groups found. Scrape a group from the Members page first.</div>
                )}
              </div>
              {selectedGroups.length > 0 && (
                <p className="text-xs text-cyan-400 font-bold">{selectedGroups.length} group(s) selected — {sourceGroups.filter(g => selectedGroups.includes(g.sourceGroupId!)).reduce((a, b) => a + b.memberCount, 0)} total targets</p>
              )}
            </TabsContent>

            {/* Individual Members Tab */}
            <TabsContent value="members" className="flex-1 overflow-hidden flex flex-col outline-none mt-4">
              <div className="relative mb-3 shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input 
                  placeholder="Search by username, name, or Telegram ID..."
                  value={memberSearch}
                  onChange={e => setMemberSearch(e.target.value)}
                  className="pl-10 bg-slate-900 border-slate-800 text-white h-10 text-sm"
                />
              </div>

              <div className="flex items-center justify-between mb-2 text-xs shrink-0">
                <span className="text-slate-500">{filteredMembers.length} members shown</span>
                <div className="flex gap-2">
                  <button onClick={() => setSelectedMembers(filteredMembers.map(m => m.id))} className="text-cyan-400 hover:text-cyan-300 font-bold uppercase tracking-widest text-[10px]">Select Visible</button>
                  <button onClick={() => setSelectedMembers([])} className="text-slate-500 hover:text-white font-bold uppercase tracking-widest text-[10px]">Clear</button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-1 pr-1 max-h-[300px]">
                {filteredMembers.slice(0, 200).map(m => {
                  const isChecked = selectedMembers.includes(m.id);
                  return (
                    <div key={m.id} onClick={() => toggleMember(m.id)} className={`flex items-center gap-3 px-3 py-2 rounded cursor-pointer transition-all text-xs ${isChecked ? 'bg-cyan-600/10 border border-cyan-500/30' : 'hover:bg-slate-800/50 border border-transparent'}`}>
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${isChecked ? 'bg-cyan-500 border-cyan-500' : 'border-slate-600'}`}>
                        {isChecked && <CheckCircle className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <span className="text-white font-mono truncate flex-1">@{m.username || m.telegramId}</span>
                      <span className="text-slate-500 truncate max-w-[120px]">{m.firstName} {m.lastName || ''}</span>
                      {m.sourceGroupId && <span className="text-[10px] text-slate-600 truncate max-w-[100px]">{m.sourceGroupId}</span>}
                    </div>
                  )
                })}
                {filteredMembers.length === 0 && <p className="py-8 text-center text-slate-500 italic">No members match your search criteria.</p>}
                {filteredMembers.length > 200 && <p className="py-2 text-center text-slate-500 text-[10px]">Showing first 200 results. Refine your search to see more.</p>}
              </div>

              {selectedMembers.length > 0 && (
                <p className="text-xs text-cyan-400 font-bold mt-2 shrink-0">{selectedMembers.length} member(s) selected</p>
              )}
            </TabsContent>

            {/* All Members Tab */}
            <TabsContent value="all" className="flex-1 outline-none mt-4">
              <div className="py-10 text-center">
                <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-cyan-400" />
                </div>
                <p className="text-white font-bold text-lg">Nuclear Payload Injection</p>
                <p className="text-slate-400 text-sm mt-2 max-w-md mx-auto">This will assign <strong className="text-white">every single member</strong> in your database to this campaign. Use with caution on large datasets.</p>
              </div>
            </TabsContent>

            {/* Manual Entry Tab */}
            <TabsContent value="manual" className="flex-1 overflow-hidden flex flex-col outline-none mt-4">
              <p className="text-xs text-slate-500 mb-3">Type or paste Telegram usernames below (one per line, or comma-separated). They will be auto-created in the database and assigned to this campaign.</p>
              <textarea 
                value={manualUsernames}
                onChange={e => setManualUsernames(e.target.value)}
                placeholder={"@jaouadtijan\n@cryptowhale\n@viptrader\n...or paste a list of usernames"}
                className="flex-1 w-full min-h-[200px] bg-slate-900 border border-slate-800 rounded-lg p-4 text-sm font-mono text-white placeholder:text-slate-600 focus:ring-2 focus:ring-purple-500 outline-none resize-none"
              />
              {manualUsernames.trim() && (
                <p className="text-xs text-purple-400 font-bold mt-2 shrink-0">
                  {manualUsernames.split(/[\n,;]+/).map(u => u.trim().replace(/^@/, '')).filter(u => u.length > 0).length} username(s) detected
                </p>
              )}
            </TabsContent>
          </Tabs>
          
          <DialogFooter className="border-t border-slate-800 pt-4 shrink-0">
            <Button variant="ghost" onClick={() => setIsTargetModalOpen(false)} className="text-slate-400 hover:text-white">Cancel</Button>
            <Button 
              onClick={handleAssignTargets} 
              disabled={isAssigning || (targetMode === 'groups' && selectedGroups.length === 0) || (targetMode === 'members' && selectedMembers.length === 0) || (targetMode === 'manual' && !manualUsernames.trim())}
              className="bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg shadow-cyan-900/50"
            >
              {isAssigning ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Processing...</> : <><Target className="w-4 h-4 mr-2" /> Load Targets</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== TEST PING MODAL ===== */}
      <Dialog open={isTestModalOpen} onOpenChange={setIsTestModalOpen}>
        <DialogContent className="sm:max-w-md bg-slate-950 border-slate-800 text-white shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2 text-indigo-400">
               <AlertCircle className="w-5 h-5" /> Dry-Run Test Ping
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Verify your template styling by securely blasting it to a single dedicated test username right now.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
             <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider font-semibold text-slate-400">Test Target Username</label>
                <Input
                   placeholder="e.g. your_telegram_handle"
                   value={testTarget}
                   onChange={(e) => setTestTarget(e.target.value)}
                   className="bg-slate-900 border-slate-800 text-white focus:ring-indigo-500 h-11"
                />
             </div>
             
             <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider font-semibold text-slate-400">Executing Account</label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full px-4 h-11 bg-slate-900 border border-slate-800 text-white rounded-md focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                >
                  <option value="">-- Choose sender account --</option>
                  {campaigns.find(c => c.id === selectedCampaignId)?.accounts.map((a: any) => (
                    <option key={a.telegramAccountId} value={a.telegramAccountId}>
                      {a.telegramAccount?.name || a.telegramAccount?.phone}
                    </option>
                  ))}
                </select>
             </div>
          </div>
          
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsTestModalOpen(false)} className="text-slate-400 hover:text-white">Cancel</Button>
            <Button onClick={handleTestSend} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/50">Fire Template Ping</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
