'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Save, Globe, Activity, Globe2, BarChart, Tag, Maximize2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SeoDashboard() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    SEO_TITLE: '',
    SEO_DESCRIPTION: '',
    SEO_KEYWORDS: '',
    SEO_VERIFY_GOOGLE: '',
    SEO_VERIFY_BING: ''
  });

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      fetchConfig();
    }
  }, [status, session]);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setFormData({
          SEO_TITLE: data.SEO_TITLE || 'Telegram Automation Panel',
          SEO_DESCRIPTION: data.SEO_DESCRIPTION || 'Professional Telegram automation and campaign management',
          SEO_KEYWORDS: data.SEO_KEYWORDS || 'telegram, automation, crypto, scraper, marketing',
          SEO_VERIFY_GOOGLE: data.SEO_VERIFY_GOOGLE || '',
          SEO_VERIFY_BING: data.SEO_VERIFY_BING || ''
        });
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const id = toast.loading('Synchronizing Core SEO Index...');
    try {
      const res = await fetch('/api/settings', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success('Search Index configurations successfully applied.', { id });
    } catch (error: any) {
      toast.error(error.message, { id });
    } finally {
      setIsSaving(false);
    }
  };

  if (status === 'loading' || loading) return <div className="min-h-[500px] flex items-center justify-center"><Activity className="w-10 h-10 text-indigo-500 animate-spin" /></div>;
  if (session?.user?.role !== 'ADMIN') return <div className="py-20 text-center text-red-400 font-bold">Classified Access Restricted.</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
             <Search className="w-8 h-8 text-emerald-500" /> Global Search Optimization
          </h1>
          <p className="text-slate-400 mt-1">Manipulate robotic crawlers and meta architectures to dominate search engine algorithms.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <Card className="lg:col-span-2 bg-slate-900 border-slate-800 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
            <CardHeader className="border-b border-slate-800/80 bg-slate-950/30">
               <CardTitle className="text-lg text-white font-bold flex items-center gap-2">
                 <Globe2 className="w-5 h-5 text-emerald-400" /> Web Metadata Payload
               </CardTitle>
               <CardDescription className="text-slate-400">
                  Defines exactly what payloads platforms like Google, Twitter, and Facebook extract when your link is shared.
               </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
               <form onSubmit={handleSave} className="space-y-6">
                 
                 <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest font-bold text-slate-400 flex items-center gap-1.5 line-clamp-1">
                      <Maximize2 className="w-3.5 h-3.5" /> Site Application Title
                    </label>
                    <Input 
                      value={formData.SEO_TITLE}
                      onChange={(e) => setFormData({...formData, SEO_TITLE: e.target.value})}
                      className="bg-slate-950 border-slate-800 text-white font-semibold focus:ring-emerald-500 h-11" 
                    />
                 </div>

                 <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest font-bold text-slate-400 flex justify-between items-center">
                      <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> Meta Description Payload</span>
                    </label>
                    <textarea 
                      value={formData.SEO_DESCRIPTION}
                      onChange={(e) => setFormData({...formData, SEO_DESCRIPTION: e.target.value})}
                      rows={3}
                      className="w-full rounded-md bg-slate-950 border border-slate-800 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-emerald-500 shadow-inner p-3 outline-none" 
                    />
                 </div>

                 <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest font-bold text-slate-400 flex items-center gap-1.5 line-clamp-1">
                      <Tag className="w-3.5 h-3.5" /> Algorithmic Keywords (Comma Separated)
                    </label>
                    <Input 
                      value={formData.SEO_KEYWORDS}
                      onChange={(e) => setFormData({...formData, SEO_KEYWORDS: e.target.value})}
                      className="bg-slate-950 border-slate-800 text-emerald-400 font-mono focus:ring-emerald-500 h-11 placeholder:text-slate-700" 
                    />
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-800/80">
                   <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-slate-500">Google Domain Verification</label>
                      <Input 
                        placeholder="google-site-verification=code"
                        value={formData.SEO_VERIFY_GOOGLE}
                        onChange={(e) => setFormData({...formData, SEO_VERIFY_GOOGLE: e.target.value})}
                        className="bg-slate-950 border-slate-800 text-white focus:ring-emerald-500 h-10 text-xs font-mono" 
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-slate-500">Bing Domain Verification</label>
                      <Input 
                        placeholder="msvalidate.01=code"
                        value={formData.SEO_VERIFY_BING}
                        onChange={(e) => setFormData({...formData, SEO_VERIFY_BING: e.target.value})}
                        className="bg-slate-950 border-slate-800 text-white focus:ring-emerald-500 h-10 text-xs font-mono" 
                      />
                   </div>
                 </div>

                 <div className="pt-4">
                    <Button 
                      type="submit" 
                      disabled={isSaving}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-900/50 h-12 text-sm uppercase tracking-wider"
                    >
                       <Save className="w-4 h-4 mr-2" /> {isSaving ? 'Compiling Index...' : 'Commit Configuration to Global Pipeline'}
                    </Button>
                 </div>
               </form>
            </CardContent>
         </Card>

         <div className="space-y-6">
             <div className="bg-slate-900 border border-emerald-500/20 rounded-xl p-6 shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-linear-to-br from-emerald-500/5 to-transparent pointer-events-none" />
                <h3 className="text-sm font-bold tracking-wider text-emerald-400 uppercase mb-4 flex items-center gap-2"><BarChart className="w-4 h-4" /> SEO Integrity Core</h3>
                
                <div className="space-y-4">
                   <div className="p-4 bg-slate-950/80 rounded-lg border border-slate-800/80 flex items-center justify-between">
                      <div>
                         <p className="text-white font-bold text-sm">Robots Protocol</p>
                         <p className="text-slate-400 text-xs mt-0.5">Automated directive generator for web crawlers.</p>
                      </div>
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">INDEX, FOLLOW</span>
                   </div>
                   <div className="p-4 bg-slate-950/80 rounded-lg border border-slate-800/80 flex items-center justify-between">
                      <div>
                         <p className="text-white font-bold text-sm">Site Map Registry</p>
                         <p className="text-slate-400 text-xs mt-0.5">Dynamic XML routing tree.</p>
                      </div>
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">ACTIVE</span>
                   </div>
                   <div className="p-4 bg-slate-950/80 rounded-lg border border-slate-800/80 flex items-center justify-between">
                      <div>
                         <p className="text-white font-bold text-sm">Server Side Rendering</p>
                         <p className="text-slate-400 text-xs mt-0.5">Ensures JS DOM is readable by old bots.</p>
                      </div>
                      <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded">V8 CLOUD</span>
                   </div>
                </div>
             </div>
         </div>
      </div>
    </div>
  );
}
