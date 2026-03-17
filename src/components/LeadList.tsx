"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Lead } from '@/types/database';
import { LeadCard } from './LeadCard';
import { Loader2, ExternalLink, MessageSquare, Archive } from 'lucide-react';
import { LeadCardSkeleton } from './Skeletons';

interface LeadListProps {
    overrideLeads?: Lead[];
    isLoading?: boolean;
}

export const LeadList: React.FC<LeadListProps> = ({ overrideLeads, isLoading: externalLoading }: LeadListProps) => {
    const [internalLeads, setInternalLeads] = useState<Lead[]>([]);
    const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [bulkUpdating, setBulkUpdating] = useState(false);

    const leads = overrideLeads || internalLeads;
    const isLoading = externalLoading !== undefined ? externalLoading : loading;

    const toggleSelect = (id: string, selected: boolean) => {
        const next = new Set(selectedLeads);
        if (selected) next.add(id);
        else next.delete(id);
        setSelectedLeads(next);
    };

    const handleBulkStatusChange = async (status: Lead['status'] | 'Archived') => {
        setBulkUpdating(true);
        const ids = Array.from(selectedLeads);

        const { error } = await supabase
            .from('leads')
            .update({ status })
            .in('id', ids);

        if (!error) {
            setSelectedLeads(new Set());
            if (!overrideLeads) fetchLeads();
        }
        setBulkUpdating(false);
    };

    const fetchLeads = async () => {
        if (overrideLeads) return;
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('leads')
                .select('*')
                .order('post_time', { ascending: false });

            if (error) throw error;
            setInternalLeads(data || []);
        } catch (err: any) {
            console.error('Fetch Leads Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        const csv = leads.map((l: Lead) => `${l.title},${l.mileage},${l.location},${l.status}`).join('\n');
        const blob = new Blob([`Title,Mileage,Location,Status\n${csv}`], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `private-car-buyer-leads-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    useEffect(() => {
        if (!overrideLeads) fetchLeads();
    }, [overrideLeads]);

    if (isLoading && leads.length === 0) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <LeadCardSkeleton key={i} />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">Sniper Feed</h2>
                    <span className="bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 text-[10px] font-black px-3 py-1 rounded-full tracking-widest uppercase">
                        {leads.length} TARGETS ACQUIRED
                    </span>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-5 py-2.5 glass-card rounded-2xl text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-white transition-all active:scale-95"
                    >
                        <ExternalLink size={16} />
                        <span className="hidden sm:inline">Export CSV</span>
                    </button>
                    {!overrideLeads && (
                        <button
                            onClick={fetchLeads}
                            className="p-3 glass-card rounded-2xl text-slate-400 hover:text-indigo-400 transition-all active:rotate-180 duration-500 active:scale-95"
                        >
                            <Loader2 size={18} />
                        </button>
                    )}
                </div>
            </div>

            {selectedLeads.size > 0 && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 glass-card bg-[#020617]/90 text-white px-10 py-6 rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.8)] flex items-center gap-10 animate-in fade-in slide-in-from-bottom-8 duration-500 border border-white/10 ring-1 ring-indigo-500/20">
                    <div className="flex flex-col">
                        <p className="text-xs font-black uppercase tracking-[0.3em] italic leading-none">{selectedLeads.size} Targets</p>
                        <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mt-1 opacity-60">Locked in Batch</p>
                    </div>
                    <div className="h-10 w-px bg-white/10"></div>
                    <div className="flex gap-4">
                        <button
                            onClick={() => handleBulkStatusChange('Contacted')}
                            disabled={bulkUpdating}
                            className="text-[10px] font-black uppercase tracking-widest bg-indigo-600 text-white px-8 py-4 rounded-[1.5rem] hover:bg-indigo-500 transition-all flex items-center gap-3 shadow-2xl shadow-indigo-500/40 active:scale-95 border border-indigo-400/20 italic"
                        >
                            <MessageSquare size={16} className="fill-current" />
                            Engage Targets
                        </button>
                        <button
                            onClick={() => handleBulkStatusChange('Archived')}
                            disabled={bulkUpdating}
                            className="text-[10px] font-black uppercase tracking-widest bg-slate-900 text-slate-400 px-8 py-4 rounded-[1.5rem] hover:bg-slate-800 hover:text-white transition-all flex items-center gap-3 border border-white/5 active:scale-95 italic"
                        >
                            <Archive size={16} />
                            Dismiss
                        </button>
                    </div>
                    <button
                        onClick={() => setSelectedLeads(new Set())}
                        className="text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-white transition-all italic underline underline-offset-4"
                    >
                        Abort
                    </button>
                </div>
            )}

            {leads.length === 0 ? (
                <div className="glass-card py-32 rounded-[3.5rem] flex flex-col items-center justify-center text-center space-y-6 border-white/5 shadow-2xl">
                    <div className="w-24 h-24 bg-slate-950 rounded-[2rem] border border-white/5 flex items-center justify-center text-slate-800 shadow-2xl">
                        <Loader2 size={48} className="animate-spin" />
                    </div>
                    <div className="space-y-2">
                        <p className="text-slate-500 font-black uppercase text-xs tracking-[0.4em] italic">Zero Matches in Sector</p>
                        <p className="text-[10px] text-slate-700 font-black uppercase tracking-widest">Awaiting Fresh Scraper Ingestion • Node Active</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {leads.map((lead: Lead) => (
                        <LeadCard
                            key={lead.id}
                            lead={lead}
                            isSelected={selectedLeads.has(lead.id)}
                            onSelect={toggleSelect}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
