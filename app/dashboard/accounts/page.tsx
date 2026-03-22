'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Smartphone, CheckCircle2, XCircle, Plus, Trash2, Loader2, ShieldCheck, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export default function AccountsPage() {
  const { data: session, status } = useSession();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Auth flow state
  const [step, setStep] = useState<'phone' | 'code' | '2fa'>('phone');
  const [phone, setPhone] = useState('');
  const [apiId, setApiId] = useState('');
  const [apiHash, setApiHash] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [phoneCodeHash, setPhoneCodeHash] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchAccounts();
    }
  }, [status]);

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/telegram/accounts');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setAccounts(data || []);
    } catch (error) {
      toast.error('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleSendCode = async () => {
    if (!apiId || !apiHash) return toast.error('Please enter your API ID and Hash');
    if (!phone) return toast.error('Please enter a phone number');

    setIsAuthLoading(true);
    try {
      const response = await fetch('/api/telegram/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, apiId, apiHash }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setPhoneCodeHash(data.phoneCodeHash);
      setStep('code');
      toast.success('Verification code sent safely');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send code');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code) return toast.error('Please enter the verification code');

    setIsAuthLoading(true);
    try {
      const response = await fetch('/api/telegram/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code, phoneCodeHash, password, apiId, apiHash }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      if (data.requires2FA) {
        setStep('2fa');
        toast.info('Two-step verification required');
      } else {
        toast.success('Account successfully connected');
        setIsModalOpen(false);
        resetAuthFlow();
        fetchAccounts();
      }
    } catch (error: any) {
      toast.error(error.message || 'Verification failed');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (!confirm('Are you sure you want to delete this account?')) return;
    try {
      const response = await fetch('/api/telegram/accounts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (response.ok) {
        toast.success('Account successfully removed');
        fetchAccounts();
      }
    } catch (error) {
      toast.error('Failed to delete account');
    }
  };

  const resetAuthFlow = () => {
    setStep('phone');
    setPhone('');
    setApiId('');
    setApiHash('');
    setCode('');
    setPassword('');
    setPhoneCodeHash('');
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Active Identities</h1>
          <p className="text-slate-400 mt-1">Manage physical Telegram sessions used for scraping and sending.</p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-linear-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40 transition-all font-medium"
        >
          <Plus className="w-5 h-5 mr-2" /> Connect New Session
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800 relative overflow-hidden shadow-xl">
           <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 opacity-5 blur-2xl rounded-full" />
           <CardContent className="p-6">
             <p className="text-sm font-medium text-slate-400">Total Authorized</p>
             <p className="text-4xl font-extrabold text-white mt-1">{accounts.length}</p>
           </CardContent>
        </Card>
        <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800 relative overflow-hidden shadow-xl">
           <div className="absolute top-0 right-0 w-32 h-32 bg-green-500 opacity-5 blur-2xl rounded-full" />
           <CardContent className="p-6">
             <p className="text-sm font-medium text-slate-400">Operational Readiness</p>
             <p className="text-4xl font-extrabold text-green-400 mt-1">{accounts.filter(a => a.status === 'ACTIVE').length}</p>
           </CardContent>
        </Card>
        <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800 relative overflow-hidden shadow-xl">
           <div className="absolute top-0 right-0 w-32 h-32 bg-red-500 opacity-5 blur-2xl rounded-full" />
           <CardContent className="p-6">
             <p className="text-sm font-medium text-slate-400">Restricted / Banned</p>
             <p className="text-4xl font-extrabold text-red-400 mt-1">{accounts.filter(a => a.status === 'BANNED' || a.status === 'LIMITED').length}</p>
           </CardContent>
        </Card>
      </div>

      {/* Grid of Accounts */}
      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
        </div>
      ) : accounts.length === 0 ? (
        <Card className="bg-slate-900/50 backdrop-blur-xl border-dashed border-slate-800 shadow-xl">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mb-6">
              <Smartphone className="w-10 h-10 text-slate-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No Active Identities</h3>
            <p className="text-slate-400 max-w-sm mb-6">Connect your first Telegram account to utilize the automation engine for messaging and scraping.</p>
            <Button onClick={() => setIsModalOpen(true)} className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700">
              Connect Session
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {accounts.map((account) => (
            <Card key={account.id} className="bg-slate-900/50 backdrop-blur-xl border-slate-800 shadow-xl hover:border-slate-700 transition-colors group relative overflow-hidden">
               <div className={`absolute top-0 w-full h-1 ${
                 account.status === 'ACTIVE' ? 'bg-green-500' :
                 account.status === 'LIMITED' ? 'bg-yellow-500' :
                 'bg-red-500'
               }`} />
               <CardContent className="p-6">
                 <div className="flex items-start justify-between mb-4">
                   <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 font-bold text-lg text-slate-300">
                        {account.name?.charAt(0) || account.username?.charAt(0) || '?'}
                     </div>
                     <div>
                       <h3 className="text-lg font-bold text-white">{account.name || 'Unknown Name'}</h3>
                       <p className="text-sm font-mono text-slate-400">{account.phone}</p>
                     </div>
                   </div>
                   <Button
                      onClick={() => handleDeleteAccount(account.id)}
                      size="icon"
                      variant="ghost"
                      className="text-slate-500 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-500/10 transition-all -m-2"
                   >
                      <Trash2 className="w-4 h-4" />
                   </Button>
                 </div>
                 
                 <div className="space-y-3 pt-4 border-t border-slate-800/50">
                    <div className="flex items-center justify-between text-sm">
                       <span className="text-slate-500">API Gateway</span>
                       <span className="text-slate-300 font-mono text-xs">{account.apiId ? String(account.apiId).slice(0,4) + '...' : 'Global'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                       <span className="text-slate-500">Status Firewall</span>
                       <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider ${
                         account.status === 'ACTIVE' ? 'bg-green-500/10 text-green-400' :
                         account.status === 'LIMITED' ? 'bg-yellow-500/10 text-yellow-400' :
                         'bg-red-500/10 text-red-400'
                       }`}>
                         {account.status === 'ACTIVE' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                         {account.status}
                       </span>
                    </div>
                 </div>
               </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Auth Modal */}
      <Dialog open={isModalOpen} onOpenChange={(open) => { setIsModalOpen(open); if (!open) resetAuthFlow(); }}>
        <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800 text-white shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
              Secure Identity Connection
            </DialogTitle>
            <DialogDescription className="text-slate-400 pt-1">
              Add a physical Telegram session. Requires official API credentials.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-6">
            {step === 'phone' && (
              <div className="space-y-5">
                <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg flex gap-3 text-sm text-blue-300 items-start">
                   <KeyRound className="w-4 h-4 shrink-0 mt-0.5" />
                   <p>Get your API ID and Hash from <a href="https://my.telegram.org" target="_blank" rel="noreferrer" className="underline hover:text-blue-200">my.telegram.org</a></p>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Telegram API ID</label>
                  <Input
                    placeholder="e.g., 1234567"
                    value={apiId}
                    onChange={(e) => setApiId(e.target.value)}
                    className="bg-slate-950 border-slate-800 text-white focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Telegram API Hash</label>
                  <Input
                    placeholder="e.g., abcdef1234567890abcdef"
                    value={apiHash}
                    onChange={(e) => setApiHash(e.target.value)}
                    className="bg-slate-950 border-slate-800 text-white focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Target Phone Number</label>
                  <Input
                    placeholder="+1234567890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="bg-slate-950 border-slate-800 text-white focus:ring-blue-500"
                  />
                </div>
                <Button 
                  onClick={handleSendCode} 
                  disabled={isAuthLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-2"
                >
                  {isAuthLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Request Access Code"}
                </Button>
              </div>
            )}

            {step === 'code' && (
              <div className="space-y-5">
                <div className="text-center space-y-2 mb-6">
                   <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto border border-blue-500/20">
                     <Smartphone className="w-6 h-6 text-blue-400" />
                   </div>
                   <p className="text-sm text-slate-300">We sent a verification code to <span className="font-semibold text-white">{phone}</span> inside the official Telegram app.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Telegram Code</label>
                  <Input
                    placeholder="12345"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="bg-slate-950 border-slate-800 text-white focus:ring-blue-500 text-center tracking-widest text-lg font-mono"
                  />
                </div>
                <Button 
                  onClick={handleVerifyCode} 
                  disabled={isAuthLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isAuthLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify Identity"}
                </Button>
              </div>
            )}

            {step === '2fa' && (
              <div className="space-y-5">
                <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg text-sm text-yellow-300 text-center">
                   This account uses Two-Step Verification.
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cloud Password</label>
                  <Input
                    type="password"
                    placeholder="Enter your 2FA password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-slate-950 border-slate-800 text-white focus:ring-yellow-500"
                  />
                </div>
                <Button 
                  onClick={handleVerifyCode} 
                  disabled={isAuthLoading}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  {isAuthLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Unlock Session"}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
