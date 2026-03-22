'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings2, ShieldCheck, UsersRound, Save, UserPlus, KeyRound, Mail, User, Trash2, Activity } from 'lucide-react';
import { toast } from 'sonner';

interface PlatformUser {
  id: string;
  name: string | null;
  username: string | null;
  email: string | null;
  role: string;
  createdAt: string;
}

export default function SettingsDashboard() {
  const { data: session, status } = useSession();
  
  // Profile State
  const [profileEmail, setProfileEmail] = useState('');
  const [profileUsername, setProfileUsername] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Sub-User State
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', username: '', password: '', role: 'USER' });
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      if (session.user.email) setProfileEmail(session.user.email);
      if ((session.user as any).username) setProfileUsername((session.user as any).username);
      fetchUsers();
    }
  }, [status, session]);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await fetch('/api/admin/users');
      if (res.ok) setUsers(await res.json());
    } catch {} finally {
      setLoadingUsers(false);
    }
  };

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    const id = toast.loading('Encrypting new profile credentials...');
    try {
      const payload: any = {};
      if (profileEmail !== session?.user?.email) payload.email = profileEmail;
      if (profileUsername !== (session?.user as any)?.username) payload.username = profileUsername;
      if (profilePassword) payload.password = profilePassword;

      if (Object.keys(payload).length === 0) throw new Error("No changes detected.");

      const res = await fetch('/api/settings/profile', {
         method: 'PUT',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(data.message, { id, duration: 6000 });
      setProfilePassword('');
    } catch (error: any) {
      toast.error(error.message, { id });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleCreateUser = async (e: FormEvent) => {
    e.preventDefault();
    setIsCreatingUser(true);
    const id = toast.loading('Provisioning new platform operator...');
    try {
      const res = await fetch('/api/admin/users', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(newUser)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(`Operator ${newUser.email} successfully provisioned!`, { id });
      setNewUser({ email: '', username: '', password: '', role: 'USER' });
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message, { id });
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you absolutely certain you want to purge this operator? This will irrevocably revoke their platform access.')) return;
    try {
      const res = await fetch(`/api/admin/users?id=${userId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success('Operator access permanently revoked.');
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (status === 'loading') return <div className="min-h-[500px] flex items-center justify-center"><Activity className="w-10 h-10 text-indigo-500 animate-spin" /></div>;
  if (session?.user?.role !== 'ADMIN') return <div className="py-20 text-center text-red-400 font-bold">Classified Access Restricted.</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
             <Settings2 className="w-8 h-8 text-blue-500" /> Administrative Frame
          </h1>
          <p className="text-slate-400 mt-1">Configure your root credentials and issue scoped operator arrays to your team.</p>
        </div>
      </div>

      <Tabs defaultValue="security" className="space-y-6">
        <TabsList className="bg-slate-900 border border-slate-800 p-1 rounded-lg">
          <TabsTrigger value="security" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <ShieldCheck className="w-4 h-4 mr-2" /> Security Clearances
          </TabsTrigger>
          <TabsTrigger value="operators" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <UsersRound className="w-4 h-4 mr-2" /> Global Operators
          </TabsTrigger>
        </TabsList>

        {/* Personal Security Tab */}
        <TabsContent value="security" className="space-y-6 outline-none">
           <Card className="bg-slate-900 border-slate-800 shadow-2xl relative overflow-hidden max-w-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
              <CardHeader className="border-b border-slate-800/80 bg-slate-950/30">
                 <CardTitle className="text-lg text-white font-bold">Master Identity Overrides</CardTitle>
                 <CardDescription className="text-slate-400">Update your core login signatures. These changes will apply immediately to your current session boundary.</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                 <form onSubmit={handleUpdateProfile} className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-xs uppercase tracking-widest font-bold text-slate-400 flex items-center gap-1.5 line-clamp-1">
                        <Mail className="w-3.5 h-3.5" /> Root Email Address
                      </label>
                      <Input 
                        type="email"
                        required
                        value={profileEmail}
                        onChange={(e) => setProfileEmail(e.target.value)}
                        className="bg-slate-950 border-slate-800 text-white font-mono focus:ring-blue-500 h-11" 
                      />
                   </div>

                   <div className="space-y-2">
                      <label className="text-xs uppercase tracking-widest font-bold text-slate-400 flex items-center gap-1.5 line-clamp-1">
                        <User className="w-3.5 h-3.5" /> Operator Call Sign (Username)
                      </label>
                      <Input 
                        value={profileUsername}
                        onChange={(e) => setProfileUsername(e.target.value)}
                        className="bg-slate-950 border-slate-800 text-white font-mono focus:ring-blue-500 h-11" 
                      />
                   </div>

                   <div className="space-y-2">
                      <label className="text-xs uppercase tracking-widest font-bold text-slate-400 flex justify-between items-center">
                        <span className="flex items-center gap-1.5"><KeyRound className="w-3.5 h-3.5" /> Core Password Matrix</span>
                      </label>
                      <Input 
                        type="password"
                        placeholder="Leave entirely blank to maintain current encryption key"
                        value={profilePassword}
                        onChange={(e) => setProfilePassword(e.target.value)}
                        className="bg-slate-950 border-slate-800 text-white font-mono placeholder:text-slate-600 focus:ring-blue-500 h-11" 
                      />
                   </div>

                   <div className="pt-4 border-t border-slate-800/80">
                      <Button 
                        type="submit" 
                        disabled={isSavingProfile}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-900/50 h-11 uppercase tracking-wider text-sm"
                      >
                         <Save className="w-4 h-4 mr-2" /> {isSavingProfile ? 'Recompiling Security Arrays...' : 'Override Root Signatures'}
                      </Button>
                   </div>
                 </form>
              </CardContent>
           </Card>
        </TabsContent>

        {/* Sub-Users Tab */}
        <TabsContent value="operators" className="grid grid-cols-1 lg:grid-cols-3 gap-8 outline-none">
           {/* Issue New Operator */}
           <Card className="lg:col-span-1 bg-slate-900 border-slate-800 shadow-xl h-max">
              <CardHeader className="border-b border-slate-800/80 bg-slate-950/30">
                 <CardTitle className="text-base text-white font-bold flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-blue-400" /> Provision Personnel
                 </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                 <form onSubmit={handleCreateUser} className="space-y-4">
                   <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-slate-500">Email Vector *</label>
                      <Input type="email" required value={newUser.email} onChange={e=>setNewUser({...newUser, email: e.target.value})} className="bg-slate-950 border-slate-800 text-white h-9 text-xs" />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-slate-500">Username *</label>
                      <Input required value={newUser.username} onChange={e=>setNewUser({...newUser, username: e.target.value})} className="bg-slate-950 border-slate-800 text-white h-9 text-xs" />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-slate-500">Encryption Key (Password) *</label>
                      <Input type="password" required value={newUser.password} onChange={e=>setNewUser({...newUser, password: e.target.value})} className="bg-slate-950 border-slate-800 text-white h-9 text-xs" />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-slate-500">Clearance Node *</label>
                      <select required value={newUser.role} onChange={e=>setNewUser({...newUser, role: e.target.value})} className="w-full bg-slate-950 border border-slate-800 text-white rounded text-xs h-9 px-3">
                         <option value="USER">Restricted Operator (USER)</option>
                         <option value="ADMIN">Root Control (ADMIN)</option>
                      </select>
                   </div>
                   <div className="pt-2">
                     <Button type="submit" disabled={isCreatingUser} className="w-full bg-slate-800 border border-slate-700 hover:bg-blue-600 hover:border-blue-500 text-white h-9 text-xs">
                        Compile Account
                     </Button>
                   </div>
                 </form>
              </CardContent>
           </Card>

           {/* Central Operators Grid */}
           <Card className="lg:col-span-2 bg-slate-900 border-slate-800 shadow-xl overflow-hidden min-h-[400px]">
              <CardHeader className="border-b border-slate-800/80 bg-slate-950/30">
                 <CardTitle className="text-base text-white font-bold">Active Station Operators</CardTitle>
                 <CardDescription className="text-xs text-slate-400">All entities physically permitted to traverse the primary platform endpoints.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                 <div className="overflow-x-auto relative min-h-[300px]">
                   {loadingUsers && <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px] flex justify-center items-center z-10"><Activity className="w-6 h-6 animate-spin text-blue-500" /></div>}
                   <table className="w-full text-sm text-left">
                     <thead className="bg-slate-900 text-slate-400 text-[10px] tracking-widest uppercase border-b border-slate-800">
                        <tr>
                           <th className="px-5 py-3">Identity Tag</th>
                           <th className="px-5 py-3">Clearance</th>
                           <th className="px-5 py-3">Creation Genesis</th>
                           <th className="px-5 py-3 text-right">Revoke</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-800/50">
                        {users.map(u => (
                           <tr key={u.id} className="hover:bg-slate-800/30 transition-colors group">
                              <td className="px-5 py-3 flex flex-col gap-0.5">
                                 <span className="text-white font-semibold text-xs">{u.email}</span>
                                 <span className="text-[10px] font-mono text-slate-500">@{u.username || 'SystemNode'}</span>
                              </td>
                              <td className="px-5 py-3">
                                 <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border shadow-sm ${u.role === 'ADMIN' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                                    {u.role}
                                 </span>
                              </td>
                              <td className="px-5 py-3 text-[11px] font-mono text-slate-400">
                                 {new Date(u.createdAt).toLocaleDateString()}
                              </td>
                              <td className="px-5 py-3 text-right">
                                 {u.id !== session?.user?.id && (
                                   <Button onClick={() => handleDeleteUser(u.id)} variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:bg-red-500/10 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Trash2 className="w-4 h-4" />
                                   </Button>
                                 )}
                                 {u.id === session?.user?.id && <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mr-2">Core (You)</span>}
                              </td>
                           </tr>
                        ))}
                     </tbody>
                   </table>
                 </div>
              </CardContent>
           </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
