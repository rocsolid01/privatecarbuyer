"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { LeadList } from '@/components/LeadList';
import { Pipeline } from '@/components/Pipeline';
import { LeadAnalysisTable } from '@/components/LeadAnalysisTable';
import { Navbar } from '@/components/Navbar';
import { InfoTooltip } from '@/components/InfoTooltip';
import { TOOLTIP_CONTENT } from '@/lib/tooltip-content';
import { supabase } from '@/lib/supabase';
import { Lead, Settings } from '@/types/database';
import { Zap, TrendingUp, Play, Loader2, Clock, Car, MessageSquare, ExternalLink, Target, Settings as LucideIcon } from 'lucide-react';

export default function DashboardPage() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [scanning, setScanning] = useState(false);
    const [autoPulse, setAutoPulse] = useState(false);
    const [settingsId, setSettingsId] = useState(null as string | null);
    const [scraperSettings, setScraperSettings] = useState(null as Settings | null);
    const [error, setError] = useState(null as string | null);
    const [success, setSuccess] = useState(null as string | null);
    const [lastScan, setLastScan] = useState(null as string | null);
    const [consecutiveEmpty, setConsecutiveEmpty] = useState<number>(0);

    // View & Filter State
    const [activeTab, setActiveTab] = useState<'feed' | 'pipeline' | 'analyst'>('feed');
    const [searchQuery, setSearchQuery] = useState('');
    const [minMargin, setMinMargin] = useState<number>(0);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const { data: leadData, error: leadError } = await supabase
                .from('leads')
                .select('*')
                .order('post_time', { ascending: false });

            if (leadError) throw leadError;
            setLeads(leadData || []);

            const { data: settings } = await supabase
                .from('settings')
                .select('*')
                .limit(1)
                .maybeSingle();

            if (settings) {
                setSettingsId(settings.id);
                setAutoPulse(settings.auto_scan_enabled);
                setConsecutiveEmpty(settings.consecutive_empty_runs);
                if (settings.last_scan_at) {
                    setLastScan(new Date(settings.last_scan_at).toLocaleTimeString());
                }
                setScraperSettings(settings as Settings);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleAutoScan = async () => {
        if (!settingsId) {
            setError('System settings not found.');
            return;
        }
        const nextState = !autoPulse;
        setAutoPulse(nextState);
        const { error } = await supabase
            .from('settings')
            .update({ auto_scan_enabled: nextState })
            .eq('id', settingsId);
        if (error) setAutoPulse(!nextState);
    };

    const handleStatusChange = async (id: string, status: Lead['status']) => {
        const { error } = await supabase.from('leads').update({ status }).eq('id', id);
        if (!error) setLeads((prev: Lead[]) => prev.map(l => l.id === id ? { ...l, status } : l));
    };

    const handleDeleteLead = async (id: string) => {
        if (!confirm('Remove this lead?')) return;
        const { error } = await supabase.from('leads').delete().eq('id', id);
        if (!error) setLeads((prev: Lead[]) => prev.filter(l => l.id !== id));
    };

    useEffect(() => {
        fetchDashboardData();
        const channel = supabase
            .channel('dashboard-leads')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, (payload: any) => {
                if (payload.eventType === 'INSERT') setLeads((prev: Lead[]) => [payload.new as Lead, ...prev]);
                else if (payload.eventType === 'UPDATE') setLeads((prev: Lead[]) => prev.map(l => l.id === payload.new.id ? (payload.new as Lead) : l));
                else if (payload.eventType === 'DELETE') setLeads((prev: Lead[]) => prev.filter(l => l.id !== payload.old.id));
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, []);

    const handleScan = async () => {
        setScanning(true);
        try {
            await fetch('/api/scraper/run', { method: 'POST' });
            setSuccess('Search initiated!');
            setTimeout(() => setSuccess(null), 5000);
        } catch (err) { setError('Search failed'); }
        // Keep scanning true for a bit to simulate progress or until user stops
    };

    const handleStopScan = async () => {
        try {
            await fetch('/api/scraper/stop', { method: 'POST' });
            setScanning(false);
            setSuccess('Search stopped.');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) { setError('Failed to stop search'); }
    };

    const filteredLeads = useMemo(() => {
        return leads.filter((l: Lead) => {
            const matchesSearch = l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                l.location?.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesSearch;
        });
    }, [leads, searchQuery]);

    return (
        <div className="min-h-screen bg-[#020617] text-slate-50 relative overflow-hidden">
            <Navbar />
            <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-8">
                    <div>
                        <h1 className="text-5xl font-black text-white tracking-tighter flex items-center gap-4 italic uppercase">
                            The Feed
                            {loading && <Loader2 className="animate-spin text-indigo-500" size={28} />}
                        </h1>
                        <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px] mt-1 ml-1 opacity-70">Automated Sniper Intelligence • 24/7 Priority Monitoring</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-6">
                        <div className="flex bg-slate-950/60 rounded-2xl border border-white/5 p-1.5 shadow-2xl relative">
                            <div className="flex items-center gap-3 px-6 py-2">
                                <Target size={18} className="text-indigo-500 animate-pulse" />
                                <input
                                    type="text"
                                    placeholder="Search Leads..."
                                    className="bg-transparent border-none py-2 text-[10px] font-black uppercase tracking-widest focus:ring-0 w-64 placeholder:text-slate-700 text-white"
                                    value={searchQuery}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-3">
                            <div className="flex items-center gap-3">
                                <Link href="/settings" className="p-4 bg-slate-900 shadow-2xl border border-white/5 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all active:scale-95" title="Search Settings">
                                    <LucideIcon size={20} />
                                </Link>
                                {scanning ? (
                                    <button onClick={handleStopScan} className="group flex items-center gap-3 bg-red-600 hover:bg-red-500 text-white font-black px-8 py-4 rounded-2xl transition-all shadow-2xl shadow-red-500/20 active:scale-95 border border-white/5">
                                        <Loader2 className="animate-spin" size={18} />
                                        <span className="text-[10px] uppercase tracking-[0.2em]">Stop Search</span>
                                    </button>
                                ) : (
                                    <button onClick={handleScan} className="group flex items-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black px-8 py-4 rounded-2xl transition-all shadow-2xl shadow-indigo-500/20 active:scale-95 border border-white/5">
                                        <Play size={18} className="fill-current" />
                                        <span className="text-[10px] uppercase tracking-[0.2em]">Start Search</span>
                                    </button>
                                )}
                            </div>

                            {scraperSettings && (
                                <div className="flex items-center gap-2 px-4 py-1.5 bg-indigo-500/5 border border-indigo-500/10 rounded-full">
                                    <div className="w-1 h-1 bg-indigo-500 rounded-full animate-pulse" />
                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">
                                        Loaded: {scraperSettings.makes?.length ? scraperSettings.makes.slice(0, 2).join(', ') : 'All Makes'}
                                        {scraperSettings.makes?.length > 2 && '...'} • {scraperSettings.year_min}-{scraperSettings.year_max}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                    <div className="glass-card overflow-hidden relative p-8 rounded-[2.5rem] border border-white/5 shadow-2xl flex flex-col justify-between min-h-[220px] group">
                        <div className="flex justify-between items-start relative z-10">
                            <div className="p-4 bg-indigo-500/20 text-indigo-400 rounded-2xl border border-indigo-500/20 glow-indigo">
                                <Zap size={28} />
                            </div>
                            <div className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.25em] ${autoPulse ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-slate-800 text-slate-500'}`}>
                                {autoPulse ? 'Engine Online' : 'Engine Idle'}
                            </div>
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] opacity-60">Scanner Status</p>
                                <InfoTooltip content={TOOLTIP_CONTENT.SCAN_INTERVAL} />
                            </div>
                            <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">
                                {autoPulse ? 'Automated Scanning: ON' : 'Manual Mode'}
                            </h3>
                        </div>
                    </div>

                    <div className="glass-card p-8 rounded-[2.5rem] border border-white/5 shadow-2xl flex flex-col justify-between min-h-[220px] group">
                        <div className="flex justify-between items-start">
                            <div className="w-20 h-20 bg-slate-900/60 rounded-3xl border border-white/5 flex items-center justify-center text-slate-500 group-hover:text-indigo-400 transition-colors">
                                <Target size={40} />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] opacity-60">Search Parameters</p>
                                <InfoTooltip content={TOOLTIP_CONTENT.SEARCH_RADIUS} />
                            </div>
                            <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">
                                {scraperSettings?.radius || 200} <span className="text-sm font-black text-indigo-500 ml-1">MILE RADIUS</span>
                            </h3>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 px-4">
                    <div className="glass-card p-6 rounded-[2rem] border border-white/5 shadow-xl flex items-center gap-5 group">
                        <div className="p-4 rounded-2xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/10 group-hover:scale-110 transition-transform">
                            <Car size={24} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em]">Total Leads</p>
                                <InfoTooltip content={TOOLTIP_CONTENT.LEADS_INGESTED} />
                            </div>
                            <p className="text-xl font-black text-white italic tracking-tight">{leads.length}</p>
                        </div>
                    </div>
                    <div className="glass-card p-6 rounded-[2rem] border border-white/5 shadow-xl flex items-center gap-5 group">
                        <div className="p-4 rounded-2xl bg-slate-600/10 text-slate-400 border border-slate-500/10 group-hover:scale-110 transition-transform">
                            <Clock size={24} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em]">Last Intercept</p>
                                <InfoTooltip content={TOOLTIP_CONTENT.TEMPORAL_NODE} />
                            </div>
                            <p className="text-xl font-black text-white italic tracking-tight">{lastScan || 'Never'}</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-8 mb-8 px-4">
                    {['feed', 'pipeline', 'analyst'].map((tab) => (
                        <button key={tab} onClick={() => setActiveTab(tab as any)} className={`pb-3 text-[10px] font-black uppercase tracking-[0.25em] transition-all relative ${activeTab === tab ? 'text-white' : 'text-slate-600 hover:text-slate-400'}`}>
                            {tab}
                            {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />}
                        </button>
                    ))}
                </div>

                {activeTab === 'feed' && <LeadList overrideLeads={filteredLeads} isLoading={loading} />}
                {activeTab === 'pipeline' && <Pipeline leads={filteredLeads} onStatusChange={handleStatusChange} />}
                {activeTab === 'analyst' && <LeadAnalysisTable leads={filteredLeads} onStatusChange={handleStatusChange} onDelete={handleDeleteLead} />}
            </main>
        </div>
    );
}
