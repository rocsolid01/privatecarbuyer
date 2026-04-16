"use client";

import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { LeadAnalysisTable } from '@/components/LeadAnalysisTable';
import { InfoTooltip } from '@/components/InfoTooltip';
import { TOOLTIP_CONTENT } from '@/lib/tooltip-content';
import { Zap, ArrowRight, Clock, MessageSquare, Target, Maximize2, Minimize2, X, Sliders } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Lead, ScrapeRun } from '@/types/database';
import { LeadFilters } from '@/components/LeadFilters';

export default function AnalyticsPage() {
    const [leads, setLeads] = useState([] as Lead[]);
    const [runs, setRuns] = useState([] as ScrapeRun[]);
    const [loading, setLoading] = useState(true);
    const [isTableMaximized, setIsTableMaximized] = useState(false);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [selectedLeads, setSelectedLeads] = useState(new Set<string>());
    const [filters, setFilters] = useState({
        search: '',
        city: '',
        minYear: '',
        maxYear: '',
        minPrice: '',
        maxPrice: '',
        minMileage: '',
        maxMileage: '',
        minMargin: '',
        status: '',
        titleStatus: '',
        maxDaysOld: '',
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [leadsRes, runsRes] = await Promise.all([
                    supabase.from('leads').select('*').order('created_at', { ascending: false }),
                    supabase.from('scrape_runs').select('*').order('started_at', { ascending: false }).limit(20)
                ]);
                if (leadsRes.data) setLeads(leadsRes.data);
                if (runsRes.data) setRuns(runsRes.data);
            } catch (err) {
                console.error('Failed to fetch analytics:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const availableCities = useMemo(() => {
        return [...new Set(leads.map((l: Lead) => l.city).filter(Boolean))] as string[];
    }, [leads]);

    const filteredLeads = useMemo(() => {
        return leads.filter((l: Lead) => {
            const matchesSearch = !filters.search ||
                l.title.toLowerCase().includes(filters.search.toLowerCase()) ||
                l.location?.toLowerCase().includes(filters.search.toLowerCase()) ||
                l.city?.toLowerCase().includes(filters.search.toLowerCase()) ||
                l.ai_notes?.toLowerCase().includes(filters.search.toLowerCase());
            const matchesCity = !filters.city || l.city === filters.city;
            const year = l.year ? parseInt(l.year as any) : parseInt(l.title.match(/\b(19|20)\d{2}\b/)?.[0] || '0');
            const matchesMinYear = !filters.minYear || (year >= parseInt(filters.minYear));
            const matchesMaxYear = !filters.maxYear || (year > 0 && year <= parseInt(filters.maxYear));
            const price = (l.price !== null && l.price > 0) ? l.price : null;
            const matchesMinPrice = !filters.minPrice || (price !== null && price >= parseInt(filters.minPrice));
            const matchesMaxPrice = !filters.maxPrice || price === null || price <= parseInt(filters.maxPrice);
            const mileage = (l.mileage !== null && l.mileage > 0) ? l.mileage : null;
            const matchesMinMileage = !filters.minMileage || (mileage !== null && mileage >= parseInt(filters.minMileage));
            const matchesMileage = !filters.maxMileage || mileage === null || mileage <= parseInt(filters.maxMileage);
            const matchesMargin = !filters.minMargin || (l.ai_margin !== null && l.ai_margin >= parseInt(filters.minMargin));
            const matchesStatus = !filters.status || l.status === filters.status;
            const matchesTitle = !filters.titleStatus || (filters.titleStatus === 'Clean' ? l.is_clean_title : !l.is_clean_title);
            const postDate = l.post_time ? new Date(l.post_time) : null;
            const diffDays = postDate ? (new Date().getTime() - postDate.getTime()) / (1000 * 60 * 60 * 24) : 999;
            const matchesAge = !filters.maxDaysOld || (diffDays <= parseInt(filters.maxDaysOld));
            return matchesSearch && matchesCity && matchesMinYear && matchesMaxYear &&
                matchesMinPrice && matchesMaxPrice && matchesMinMileage && matchesMileage &&
                matchesMargin && matchesStatus && matchesTitle && matchesAge;
        });
    }, [leads, filters]);

    const toggleSelect = (id: string, selected: boolean) => {
        const next = new Set(selectedLeads);
        if (selected) next.add(id); else next.delete(id);
        setSelectedLeads(next);
    };

    const toggleSelectAll = (selected: boolean) => {
        if (selected) setSelectedLeads(new Set(filteredLeads.map((l: Lead) => l.id)));
        else setSelectedLeads(new Set());
    };

    const stats = [
        { label: 'Total Pulses', tooltip: TOOLTIP_CONTENT.TOTAL_PULSES, value: runs.length.toString(), change: '+2', positive: true, icon: Clock, color: 'text-blue-500' },
        { label: 'Leads Ingested', tooltip: TOOLTIP_CONTENT.LEADS_INGESTED, value: leads.length.toString(), change: '+5%', positive: true, icon: Zap, color: 'text-amber-500' },
        { label: 'Avg. Yield', tooltip: TOOLTIP_CONTENT.AVG_YIELD, value: (runs.length > 0 ? (leads.length / runs.length).toFixed(1) : '0'), change: '+1.5', positive: true, icon: Target, color: 'text-purple-500' },
        { label: 'Close Rate', tooltip: TOOLTIP_CONTENT.CLOSE_RATE, value: ((leads.filter((l: Lead) => l.status === 'Bought').length / (leads.length || 1)) * 100).toFixed(1) + '%', change: '0%', positive: true, icon: MessageSquare, color: 'text-indigo-500' },
    ];

    if (loading) return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
            <div className="text-indigo-500 animate-pulse font-black italic uppercase tracking-widest text-sm text-center">
                Initializing Intelligence Engine...<br />
                <span className="text-[10px] mt-2 opacity-50 block">Synchronizing Tactical Radar...</span>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-indigo-500/30">
            <Navbar />

            <main className="max-w-7xl mx-auto px-6 lg:px-12 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-8 bg-indigo-600 rounded-full" />
                            <h1 className="text-4xl font-bold uppercase tracking-tighter text-white">
                                Strategic <span className="text-indigo-500">Intelligence</span>
                            </h1>
                        </div>
                        <p className="text-slate-500 font-bold uppercase text-xs tracking-[0.2em] ml-5">
                            Engine Performance Metrics & ROI
                        </p>
                    </div>
                </div>

                {/* Top Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    {stats.map((stat, i) => (
                        <div key={i} className="glass-card bg-slate-900/40 p-6 rounded-3xl border border-white/5 transition-all hover:border-indigo-500/30 group relative overflow-hidden">
                            <div className="flex justify-between items-start mb-4">
                                <div className={'p-3 rounded-2xl bg-slate-950 border border-white/5 ' + stat.color + ' group-hover:scale-110 transition-transform duration-500'}>
                                    <stat.icon size={20} />
                                </div>
                                <div className={'flex items-center gap-1 text-xs font-black italic ' + (stat.positive ? 'text-emerald-500' : 'text-red-500')}>
                                    <ArrowRight size={14} className={stat.positive ? "" : "rotate-90"} />
                                    {stat.change}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 mb-1 leading-none">
                                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{stat.label}</h3>
                                <InfoTooltip content={stat.tooltip} />
                            </div>
                            <p className="text-4xl font-bold tracking-tighter text-white">{stat.value}</p>
                            <div className="absolute -bottom-6 -right-6 opacity-[0.03] text-white">
                                <stat.icon size={120} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Tactical Listing Table Section */}
                <div className={`pt-8 border-t border-white/5 space-y-8 ${isTableMaximized ? 'fixed inset-0 z-[100] bg-[#020617] p-8 overflow-hidden flex flex-col' : ''}`}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
                        <div className="flex items-center gap-4">
                            <h2 className={`font-black text-white uppercase tracking-tighter italic leading-none ${isTableMaximized ? 'text-4xl' : 'text-3xl'}`}>
                                Tactical Listing
                            </h2>
                            <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black px-4 py-1 rounded-full tracking-widest uppercase italic">
                                {filteredLeads.length} Nodes Online
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsFilterModalOpen(true)}
                                className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                    isFilterModalOpen
                                        ? 'bg-indigo-500 text-white shadow-[0_0_30px_rgba(99,102,241,0.4)]'
                                        : 'bg-slate-950/60 text-slate-400 border border-white/5 hover:border-indigo-500/30'
                                }`}
                            >
                                <Sliders size={14} />
                                Filter Data
                            </button>
                            <div className="h-8 w-px bg-white/5 mx-2" />
                            <button
                                onClick={() => setIsTableMaximized(!isTableMaximized)}
                                className="p-3 bg-slate-900 shadow-2xl border border-white/5 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-2 group"
                                title={isTableMaximized ? "Exit Fullscreen" : "Maximize Table"}
                            >
                                {isTableMaximized ? (
                                    <>
                                        <Minimize2 size={20} />
                                        <span className="text-[10px] font-black uppercase tracking-widest hidden group-hover:inline">Minimize</span>
                                    </>
                                ) : (
                                    <>
                                        <Maximize2 size={20} />
                                        <span className="text-[10px] font-black uppercase tracking-widest hidden group-hover:inline">Maximize</span>
                                    </>
                                )}
                            </button>
                            {isTableMaximized && (
                                <button
                                    onClick={() => setIsTableMaximized(false)}
                                    className="p-3 bg-red-600/10 text-red-500 shadow-2xl border border-red-500/10 rounded-2xl hover:bg-red-600 hover:text-white transition-all active:scale-95"
                                >
                                    <X size={20} />
                                </button>
                            )}
                        </div>
                    </div>

                    <LeadAnalysisTable
                        leads={filteredLeads}
                        onStatusChange={async (id: string, status: Lead['status']) => {
                            const { error } = await supabase.from('leads').update({ status }).eq('id', id);
                            if (!error) setLeads(leads.map((l: Lead) => l.id === id ? { ...l, status } : l));
                        }}
                        onDelete={async (id: string) => {
                            const { error } = await supabase.from('leads').delete().eq('id', id);
                            if (!error) setLeads(leads.filter((l: Lead) => l.id !== id));
                        }}
                        selectedLeads={selectedLeads}
                        onSelect={toggleSelect}
                        onSelectAll={toggleSelectAll}
                        maximized={isTableMaximized}
                    />
                </div>

                <LeadFilters
                    isOpen={isFilterModalOpen}
                    onClose={() => setIsFilterModalOpen(false)}
                    filters={filters}
                    setFilters={setFilters}
                    availableCities={availableCities}
                />
            </main>
        </div>
    );
}
