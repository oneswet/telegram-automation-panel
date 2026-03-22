'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Activity, Globe, MonitorSmartphone, Layers, MapPin, MousePointerClick, Smartphone, Laptop, Globe2 } from 'lucide-react';

interface Metric { name: string; value: number }
interface SiteVisit {
  id: string;
  ipHash?: string;
  country?: string;
  city?: string;
  source?: string;
  device?: string;
  browser?: string;
  os?: string;
  path: string;
  details?: string;
  createdAt: string;
}

export default function AnalyticsDashboard() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<{
    totalVisits: number;
    browsers: Metric[];
    devices: Metric[];
    countries: Metric[];
    recent: SiteVisit[];
  } | null>(null);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
       fetch('/api/analytics/summary')
         .then(res => res.json())
         .then(d => setData(d))
         .catch(console.error);
    }
  }, [status, session]);

  if (status === 'loading' || !data) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <Activity className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (session?.user?.role !== 'ADMIN') {
    return (
       <div className="py-20 text-center">
          <h1 className="text-2xl font-bold text-red-400">Restricted Access</h1>
          <p className="text-slate-400 mt-2">Only system administrators can access telemetry.</p>
       </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Global Visit Telemetry</h1>
        <p className="text-slate-400 mt-1">Real-time analysis of incoming traffic sources, physical locations, and device ratios.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-slate-900 border-slate-800 shadow-xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl -mr-6 -mt-6 group-hover:bg-indigo-500/20 transition-all" />
           <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                 <h3 className="text-sm font-semibold tracking-wider uppercase text-slate-400">Total Pipeline Hits</h3>
                 <Activity className="w-5 h-5 text-indigo-400" />
              </div>
              <p className="text-4xl font-black text-white">{data.totalVisits.toLocaleString()}</p>
           </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Device Matrix */}
         <Card className="bg-slate-900 border-slate-800 shadow-xl">
           <CardHeader>
             <CardTitle className="text-sm tracking-wider uppercase text-slate-400 flex items-center gap-2">
               <MonitorSmartphone className="w-4 h-4 text-cyan-400" /> Hardware Matrix
             </CardTitle>
           </CardHeader>
           <CardContent className="space-y-4">
             {data.devices.map((d, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800/80">
                   <div className="flex items-center gap-3">
                     {d.name === 'Mobile' ? <Smartphone className="w-4 h-4 text-slate-500" /> : <Laptop className="w-4 h-4 text-slate-500" />}
                     <span className="text-sm font-medium text-slate-200">{d.name}</span>
                   </div>
                   <span className="text-sm font-bold text-cyan-400">{d.value}</span>
                </div>
             ))}
             {data.devices.length === 0 && <p className="text-slate-500 text-xs italic">No device signatures available.</p>}
           </CardContent>
         </Card>

         {/* Browser Vectors */}
         <Card className="bg-slate-900 border-slate-800 shadow-xl">
           <CardHeader>
             <CardTitle className="text-sm tracking-wider uppercase text-slate-400 flex items-center gap-2">
               <Globe className="w-4 h-4 text-purple-400" /> Web Engines
             </CardTitle>
           </CardHeader>
           <CardContent className="space-y-4">
             {data.browsers.map((b, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800/80">
                   <span className="text-sm font-medium text-slate-200">{b.name}</span>
                   <span className="text-sm font-bold text-purple-400">{b.value}</span>
                </div>
             ))}
             {data.browsers.length === 0 && <p className="text-slate-500 text-xs italic">No browser vectors detected.</p>}
           </CardContent>
         </Card>

         {/* Geo IP Array */}
         <Card className="bg-slate-900 border-slate-800 shadow-xl">
           <CardHeader>
             <CardTitle className="text-sm tracking-wider uppercase text-slate-400 flex items-center gap-2">
               <MapPin className="w-4 h-4 text-green-400" /> Geographical Arrays
             </CardTitle>
           </CardHeader>
           <CardContent className="space-y-4">
             {data.countries.map((c, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800/80">
                   <div className="flex items-center gap-2">
                     <span className="text-xs font-mono text-slate-500">{i+1}.</span>
                     <span className="text-sm font-medium text-slate-200">{c.name}</span>
                   </div>
                   <span className="text-sm font-bold text-green-400">{c.value}</span>
                </div>
             ))}
             {data.countries.length === 0 && <p className="text-slate-500 text-xs italic">No geographical locks available.</p>}
           </CardContent>
         </Card>
      </div>

      {/* Raw Visit Feed */}
      <Card className="bg-slate-900 border-slate-800 shadow-2xl overflow-hidden">
        <CardHeader className="border-b border-slate-800 bg-slate-950/50">
           <CardTitle className="text-lg text-white flex items-center gap-2">
             <Layers className="w-5 h-5 text-indigo-500" /> Real-time Ingestion Stream
           </CardTitle>
           <CardDescription className="text-slate-400">Unfiltered log of incoming navigation events, paths, and sources (Latest 25)</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
             <table className="w-full text-sm text-left">
               <thead className="bg-slate-900 text-slate-400 font-medium border-b border-slate-800 text-xs tracking-wider uppercase">
                 <tr>
                   <th className="px-6 py-4">Timestamp</th>
                   <th className="px-6 py-4">Geo-Lock</th>
                   <th className="px-6 py-4">Target Path</th>
                   <th className="px-6 py-4">Hit Origin (Source)</th>
                   <th className="px-6 py-4">Device Fingerprint</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-800/50">
                 {data.recent.map((visit) => (
                   <tr key={visit.id} className="hover:bg-slate-800/30 transition-colors">
                     <td className="px-6 py-4 text-slate-400 font-mono text-[11px]">
                       {new Date(visit.createdAt).toLocaleString()}
                     </td>
                     <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                           <Globe2 className="w-3.5 h-3.5 text-slate-500" />
                           <span className="text-slate-200 text-xs font-semibold">{visit.city || 'Unknown'}, {visit.country || 'Unknown'}</span>
                        </div>
                     </td>
                     <td className="px-6 py-4 text-cyan-400 font-mono text-xs">
                       {visit.path}
                     </td>
                     <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-300 shadow-sm">
                           <MousePointerClick className="w-3 h-3 text-purple-400" />
                           {visit.source || 'Direct Hit'}
                        </span>
                     </td>
                     <td className="px-6 py-4 text-slate-400 text-xs flex flex-col gap-0.5">
                       <span className="font-semibold text-slate-200">{visit.os} • {visit.device}</span>
                       <span className="text-[10px] uppercase tracking-wider">{visit.browser}</span>
                     </td>
                   </tr>
                 ))}
                 {data.recent.length === 0 && (
                   <tr>
                     <td colSpan={5} className="px-6 py-12 text-center text-slate-500">Awaiting traffic ingestion...</td>
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
