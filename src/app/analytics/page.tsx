"use client";

import * as React from 'react';
import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { LeadAnalysisTable } from '@/components/LeadAnalysisTable';
import { InfoTooltip } from '@/components/InfoTooltip';
import { TOOLTIP_CONTENT } from '@/lib/tooltip-content';
import { Zap, ArrowRight, Clock, MessageSquare, Target } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Lead, ScrapeRun } from '@/types/database';

export default function AnalyticsPage() {
    const [leads, setLeads] = useState([] as Lead[]);
    const [runs, setRuns] = useState([] as ScrapeRun[]);
    const [loading, setLoading] = useState(true);

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

    const stats = [
        {
            label: 'Total Pulses',
            tooltip: TOOLTIP_CONTENT.TOTAL_PULSES,
            value: runs.length.toString(),
            change: '+2',
            positive: true,
            icon: Clock,
            color: 'text-blue-500'
        },
        {
            label: 'Leads Ingested',
            tooltip: TOOLTIP_CONTENT.LEADS_INGESTED,
            value: leads.length.toString(),
            change: '+5%',
            positive: true,
            icon: Zap,
            color: 'text-amber-500'
        },
        {
            label: 'Avg. Yield',
            tooltip: TOOLTIP_CONTENT.AVG_YIELD,
            value: (runs.length > 0 ? (leads.length / runs.length).toFixed(1) : '0'),
            change: '+1.5',
            positive: true,
            icon: Target,
            color: 'text-purple-500'
        },
        {
            label: 'Close Rate',
            tooltip: TOOLTIP_CONTENT.CLOSE_RATE,
            value: ((leads.filter((l: Lead) => l.status === 'Bought').length / (leads.length || 1)) * 100).toFixed(1) + '%',
            change: '0%',
            positive: true,
            icon: MessageSquare,
            color: 'text-indigo-500'
        },
    ];

    if (loading) return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
            <div className="text-indigo-500 animate-pulse font-black italic uppercase tracking-widest text-sm text-center">
                Initializing Intelligence Engine...<br/>
                <span className="text-[10px] mt-2 opacity-50 block">Synchronizing Tactical Radar...</span>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-indigo-500/30">
            <Navbar />
            
            <main className="max-w-7xl mx-auto px-6 lg:px-12 py-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-8 bg-indigo-600 rounded-full" />
                            <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white">
                                Strategic <span className="text-indigo-500">Intelligence</span>
                            </h1>
                        </div>
                        <p className="text-slate-500 font-black uppercase text-[10px] tracking-[0.3em] italic ml-5">
                            Engine Performance Metrics & ROI
                        </p>
                    </div>
                </div>

                {/* Top Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                    {stats.map((stat, i) => (
                        <div 
                            key={i} 
                            className="glass-card bg-slate-900/40 p-8 rounded-[2.5rem] border border-white/5 transition-all hover:border-indigo-500/30 group relative overflow-hidden"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className={'p-4 rounded-2xl bg-slate-950 border border-white/5 ' + stat.color + ' group-hover:scale-110 transition-transform duration-500'}>
                                    <stat.icon size={24} />
                                </div>
                                <div className={'flex items-center gap-1 text-[10px] font-black italic ' + (stat.positive ? 'text-emerald-500' : 'text-red-500')}>
                                    <ArrowRight size={14} className={stat.positive ? "" : "rotate-90"} />
                                    {stat.change}
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2 mb-2 leading-none">
                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">{stat.label}</h3>
                                <InfoTooltip content={stat.tooltip} />
                            </div>
                            
                            <p className="text-4xl font-black italic tracking-tighter text-white">{stat.value}</p>
                            
                            <div className="absolute -bottom-6 -right-6 opacity-[0.03] text-white">
                                <stat.icon size={120} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Tactical Listing Table Section */}
                <div className="space-y-8 mb-24">
                    <div className="flex items-center justify-between px-4">
                        <div className="flex items-center gap-4">
                            <Target className="text-indigo-500" size={24} />
                            <h2 className="text-xl font-black italic uppercase tracking-tighter text-white">
                                Tactical Listing
                            </h2>
                        </div>
                    </div>
                    
                    <LeadAnalysisTable 
                        leads={leads}
                        onStatusChange={async (id: string, status: Lead['status']) => {
                            const { error } = await supabase.from('leads').update({ status }).eq('id', id);
                            if (!error) setLeads(leads.map((l: Lead) => l.id === id ? { ...l, status } : l));
                        }}
                        onDelete={async (id: string) => {
                            const { error } = await supabase.from('leads').delete().eq('id', id);
                            if (!error) setLeads(leads.filter((l: Lead) => l.id !== id));
                        }}
                    />
                </div>

                                {/* Strategic History Section */}
                <div className="space-y-8 mb-24">
                    <div className="flex items-center justify-between px-4">
                        <div className="flex items-center gap-4">
                            <Clock className="text-indigo-500" size={24} />
                            <h2 className="text-xl font-black italic uppercase tracking-tighter text-white">
                                Strategic Pulse History
                            </h2>
                        </div>
                    </div>
                    
                    <LeadAnalysisTable 
                        leads={leads}
                        onStatusChange={async (id: string, status: Lead['status']) => {
                            const { error } = await supabase.from('leads').update({ status }).eq('id', id);
                            if (!error) setLeads(leads.map((l: Lead) => l.id === id ? { ...l, status } : l));
                        }}
                        onDelete={async (id: string) => {
                            const { error } = await supabase.from('leads').delete().eq('id', id);
                            if (!error) setLeads(leads.filter((l: Lead) => l.id !== id));
                        }}
                    />
                </div>

                {/* Bottom Insight Section */}
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-[3rem] blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
                    <div className="glass-card relative bg-slate-950 p-1 rounded-[3rem] border border-white/5">
                        <div className="bg-slate-900/40 p-10 rounded-[2.8rem] flex flex-col lg:flex-row items-center justify-between gap-12">
                            <div className="flex items-center gap-8">
                                <div className="w-24 h-24 bg-indigo-600/10 rounded-[2.3rem] flex items-center justify-center text-indigo-500 border border-indigo-500/20 relative overflow-hidden">
                                    <Zap size={48} className="animate-pulse relative z-10" />
                                    <div className="absolute inset-0 bg-indigo-500/5 animate-pulse" />
                                </div>
                                <div>
                                    <h4 className="text-2xl font-black italic uppercase tracking-tighter text-white mb-2">
                                        Target Node Optimization
                                    </h4>
                                    <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-md">
                                        Your strategy yields high-margin candidates. Consider re-allocating sniper resources for maximum efficiency.
                                    </p>
                                </div>
                            </div>
                            
                            <button className="w-full lg:w-auto px-12 py-5 bg-white text-slate-950 rounded-2xl font-black text-xs uppercase tracking-[0.2em] italic hover:scale-105 active:scale-95 transition-all shadow-2xl">
                                Scale Radar Coverage
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
