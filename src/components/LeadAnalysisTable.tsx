"use client";

import React, { useState, useMemo } from 'react';
import { Lead } from '@/types/database';
import {
    ExternalLink,
    MessageSquare,
    Trash2,
    TrendingUp,
    MapPin,
    Zap,
    DollarSign,
    Calendar,
    Send,
    Clock,
    X
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface LeadAnalysisTableProps {
    leads: Lead[];
    onStatusChange: (id: string, status: Lead['status']) => void;
    onDelete?: (id: string) => void;
    onAction?: (id: string, action: 'contact' | 'deep_scrape' | 'telegram') => void;
    selectedLeads?: Set<string>;
    onSelect?: (id: string, selected: boolean) => void;
    onSelectAll?: (selected: boolean) => void;
    maximized?: boolean;
}

type SortConfig = {
    key: keyof Lead | 'post_year';
    direction: 'asc' | 'desc';
};

export const LeadAnalysisTable: React.FC<LeadAnalysisTableProps> = ({
    leads,
    onStatusChange,
    onDelete,
    onAction,
    selectedLeads = new Set(),
    onSelect,
    onSelectAll,
    maximized = false
}: LeadAnalysisTableProps) => {
    const [sortConfig, setSortConfig] = useState({ key: 'ai_score', direction: 'desc' } as any);
    const [postedDateFilter, setPostedDateFilter] = useState<{ startDate: string; endDate: string } | null>(null);
    const [hoursAgoFilter, setHoursAgoFilter] = useState<string>('');

    const sortedLeads = useMemo(() => {
        let filtered = [...leads];

        // Apply "posted within X hours" filter
        if (hoursAgoFilter && Number(hoursAgoFilter) > 0) {
            const cutoff = new Date(Date.now() - Number(hoursAgoFilter) * 3600000);
            filtered = filtered.filter((lead: Lead) => new Date(lead.post_time) >= cutoff);
        }

        // Apply posted date filter
        if (postedDateFilter?.startDate || postedDateFilter?.endDate) {
            const startDate = postedDateFilter.startDate ? new Date(postedDateFilter.startDate) : null;
            const endDate = postedDateFilter.endDate ? new Date(postedDateFilter.endDate) : null;

            filtered = filtered.filter((lead: Lead) => {
                const postTime = new Date(lead.post_time);
                if (startDate && postTime < startDate) return false;
                if (endDate && postTime > new Date(endDate.getTime() + 86400000)) return false; // Include full day
                return true;
            });
        }

        // Sort
        return filtered.sort((a: any, b: any) => {
            let aVal: any = a[sortConfig.key as keyof Lead];
            let bVal: any = b[sortConfig.key as keyof Lead];

            if (sortConfig.key === 'post_year') {
                aVal = new Date(a.post_time).getFullYear();
                bVal = new Date(b.post_time).getFullYear();
            }

            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [leads, postedDateFilter, hoursAgoFilter, sortConfig]);

    const requestSort = (key: SortConfig['key']) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const SortHeader = ({ label, sortKey, align = 'left', width }: { label: string, sortKey: SortConfig['key'], align?: 'left' | 'center' | 'right', width?: string }) => (
        <th
            className={`p-3 py-5 text-[8px] font-bold text-slate-500 uppercase tracking-[0.2em] whitespace-nowrap cursor-pointer hover:text-indigo-400 transition-colors ${align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : ''} ${width || ''}`}
            onClick={() => requestSort(sortKey)}
        >
            <div className={`flex items-center gap-1 ${align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : ''}`}>
                {label}
                {sortConfig.key === sortKey ? (
                    sortConfig.direction === 'asc' ? <span>↑</span> : <span>↓</span>
                ) : null}
            </div>
        </th>
    );

    const allSelected = leads.length > 0 && selectedLeads.size === leads.length;

    return (
        <div className={`glass-card bg-slate-950/20 border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl relative flex flex-col ${maximized ? 'h-full w-full max-h-none' : 'max-h-[700px]'}`}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 rounded-full blur-[100px] -z-10" />

            {/* Filter Bar */}
            <div className="border-b border-white/5 p-4 bg-slate-950/40">
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-indigo-400" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">Posted Date:</span>
                    </div>
                    <input
                        type="date"
                        value={postedDateFilter?.startDate || ''}
                        onChange={(e) => setPostedDateFilter(prev => ({ startDate: e.target.value, endDate: prev?.endDate || '' }))}
                        className="px-2 py-1 bg-slate-900 border border-white/10 rounded text-[10px] text-slate-300 focus:border-indigo-500 focus:outline-none"
                    />
                    <span className="text-slate-500 text-[10px]">to</span>
                    <input
                        type="date"
                        value={postedDateFilter?.endDate || ''}
                        onChange={(e) => setPostedDateFilter(prev => ({ startDate: prev?.startDate || '', endDate: e.target.value }))}
                        className="px-2 py-1 bg-slate-900 border border-white/10 rounded text-[10px] text-slate-300 focus:border-indigo-500 focus:outline-none"
                    />
                    {(postedDateFilter?.startDate || postedDateFilter?.endDate) && (
                        <button
                            onClick={() => setPostedDateFilter(null)}
                            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition-all"
                            title="Clear date filter"
                        >
                            <X size={14} />
                        </button>
                    )}

                    <div className="w-px h-4 bg-white/10 mx-1" />

                    {/* Hours ago filter */}
                    <div className="flex items-center gap-2">
                        <Clock size={14} className="text-indigo-400" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">Posted within:</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <input
                            type="number"
                            min="1"
                            max="720"
                            placeholder="hrs"
                            value={hoursAgoFilter}
                            onChange={(e) => setHoursAgoFilter(e.target.value)}
                            className="w-16 px-2 py-1 bg-slate-900 border border-white/10 rounded text-[10px] text-slate-300 focus:border-indigo-500 focus:outline-none text-center"
                        />
                        <span className="text-slate-500 text-[10px]">hours</span>
                        {hoursAgoFilter && (
                            <button
                                onClick={() => setHoursAgoFilter('')}
                                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition-all"
                                title="Clear hours filter"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <span className="ml-auto text-[9px] text-slate-500 font-bold italic">
                        Showing {sortedLeads.length} of {leads.length} listings
                    </span>
                </div>
            </div>

            <div className="overflow-auto scrollbar-thin scrollbar-thumb-slate-800 flex-1">
                <table className="w-full text-left border-collapse table-fixed min-w-[1500px]">
                    <thead className="sticky top-0 z-20">
                        <tr className="bg-slate-950/60 border-b border-white/5">
                            <th className="w-12 p-3 pl-6">
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    onChange={(e: any) => onSelectAll?.(e.target.checked)}
                                    className="w-4 h-4 rounded border-white/10 bg-slate-900 checked:bg-indigo-500 transition-all cursor-pointer accent-indigo-500"
                                />
                            </th>
                            <th className="w-[20%] p-3 py-5 text-[8px] font-bold text-slate-500 uppercase tracking-[0.2em] whitespace-nowrap">Target Ident</th>
                            <SortHeader label="Price" sortKey="price" width="w-[8%]" />
                            <SortHeader label="Mileage" sortKey="mileage" width="w-[10%]" />
                            <SortHeader label="AI Score" sortKey="ai_score" width="w-[15%]" />
                            <SortHeader label="Seller Intent" sortKey="motivation_score" width="w-[15%]" />
                            <SortHeader label="Year" sortKey="post_year" width="w-[7%]" />
                            <SortHeader label="City" sortKey="city" width="w-[8%]" />
                            <SortHeader label="Status" sortKey="title_status" width="w-[7%]" />
                            <SortHeader label="Posted" sortKey="post_time" width="w-[8%]" />
                            <SortHeader label="Protocol" sortKey="status" width="w-[8%]" />
                            <SortHeader label="Scrape Time" sortKey="created_at" width="w-[10%]" />
                            <th className="p-3 py-5 text-[8px] font-bold text-slate-500 uppercase tracking-[0.2em] whitespace-nowrap text-right pr-8 w-[8%]">Intercept</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {sortedLeads.map((lead: Lead) => (
                            <tr key={lead.id} className={`hover:bg-white/[0.03] transition-colors group/row text-[10px] ${selectedLeads.has(lead.id) ? 'bg-indigo-500/5' : ''}`}>
                                <td className="p-3 pl-6">
                                    <input
                                        type="checkbox"
                                        checked={selectedLeads.has(lead.id)}
                                        onChange={(e: any) => onSelect?.(lead.id, e.target.checked)}
                                        className="w-4 h-4 rounded border-white/10 bg-slate-900 checked:bg-indigo-500 transition-all cursor-pointer accent-indigo-500"
                                    />
                                </td>
                                <td className="p-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-950 rounded-xl overflow-hidden flex-shrink-0 border border-white/5 group-hover/row:border-indigo-500/30 transition-all">
                                            {lead.photos?.[0] ? (
                                                <img src={lead.photos[0]} alt="" className="w-full h-full object-cover group-hover/row:scale-110 transition-transform duration-500" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-800 italic font-black text-[7px]">N/A</div>
                                            )}
                                        </div>
                                        <div className="truncate">
                                            <a
                                                href={lead.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-bold text-white hover:text-indigo-400 uppercase tracking-tighter truncate block transition-colors leading-none mb-1 group/link"
                                            >
                                                {lead.title}
                                                <ExternalLink size={8} className="inline ml-1 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                                            </a>
                                            <div className="flex items-center gap-1 text-[7px] text-slate-500 font-bold uppercase tracking-widest">
                                                <MapPin size={8} className="text-indigo-500" />
                                                <span className="truncate">{lead.location}</span>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-3">
                                    <div className="flex flex-col">
                                        <div className="text-white font-black italic tracking-tighter text-[11px]">
                                            ${lead.price?.toLocaleString() || '---'}
                                        </div>
                                        <div className="text-[7px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">List Price</div>
                                    </div>
                                </td>
                                <td className="p-3 font-bold italic tracking-tighter">
                                    {lead.mileage ? (
                                        <span className="text-slate-300 font-black">{lead.mileage.toLocaleString()}</span>
                                    ) : (
                                        <span className="text-slate-700 italic opacity-50 text-[8px]">NOT LISTED</span>
                                    )}
                                    <span className="text-[7px] text-slate-600 ml-1">MI</span>
                                </td>
                                <td className="p-3">
                                    {/* Row 1: Score + Margin + Spread */}
                                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                        {lead.ai_score != null && (
                                            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md border font-black italic text-[9px] tracking-widest ${
                                                lead.ai_score >= 75 ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' :
                                                lead.ai_score >= 50 ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' :
                                                'bg-red-500/10 border-red-500/20 text-red-400'
                                            }`}>
                                                <Zap size={8} />
                                                {lead.ai_score}/100
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1 px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded-md">
                                            <TrendingUp size={8} className="text-indigo-400" />
                                            <span className="text-[9px] font-bold text-indigo-400 uppercase italic tracking-widest">
                                                ${lead.ai_margin?.toLocaleString() || '—'}
                                            </span>
                                        </div>
                                        {lead.market_avg && lead.price && (
                                            <div className={`px-2 py-0.5 rounded-md border text-[8px] font-black italic tracking-widest ${
                                                lead.market_avg - lead.price > 0
                                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                                    : 'bg-slate-500/10 border-white/5 text-slate-500'
                                            }`}>
                                                {lead.market_avg - lead.price > 0 ? '↓' : '↑'}
                                                ${Math.abs(lead.market_avg - lead.price).toLocaleString()} vs mkt
                                            </div>
                                        )}
                                        {lead.seller_flags?.flags?.includes('HIGH_MOTIVATION') && (
                                            <div className="px-1.5 py-0.5 bg-orange-500/10 border border-orange-500/20 rounded text-[7px] font-black text-orange-400 uppercase tracking-widest">
                                                🔥 Motivated
                                            </div>
                                        )}
                                        {lead.is_dealer_flag && (
                                            <div className="px-1.5 py-0.5 bg-red-500/10 border border-red-500/20 rounded text-[7px] font-black text-red-400 uppercase tracking-widest">
                                                ⚠ Dealer
                                            </div>
                                        )}
                                    </div>
                                    {/* Row 2: Notes */}
                                    <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-lg p-2 group-hover/row:border-indigo-500/20 transition-all">
                                        <p className="text-[9px] text-slate-300 italic font-bold leading-tight line-clamp-2">
                                            {lead.ai_notes || "Awaiting neural analysis..."}
                                        </p>
                                    </div>
                                </td>
                                {/* Seller Intent Column */}
                                <td className="p-3">
                                    {lead.motivation_score != null ? (() => {
                                        const tier = lead.motivation_signals?.tier ?? (
                                            lead.motivation_score >= 70 ? 'HOT' :
                                            lead.motivation_score >= 40 ? 'WARM' : 'COLD'
                                        );
                                        const signals = lead.motivation_signals?.signals ?? [];
                                        const tierStyle =
                                            tier === 'HOT'    ? 'bg-orange-500/15 border-orange-500/40 text-orange-400' :
                                            tier === 'WARM'   ? 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400' :
                                            tier === 'DEALER' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                                                                'bg-slate-500/10 border-white/5 text-slate-500';
                                        const tierIcon =
                                            tier === 'HOT'    ? '🔥' :
                                            tier === 'WARM'   ? '⚡' :
                                            tier === 'DEALER' ? '⚠' : '·';
                                        return (
                                            <div>
                                                <div className="flex items-center gap-1.5 mb-1.5">
                                                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md border font-black italic text-[9px] tracking-widest ${tierStyle}`}>
                                                        <span>{tierIcon}</span>
                                                        <span>{lead.motivation_score}/100</span>
                                                    </div>
                                                    <span className={`text-[8px] font-black uppercase tracking-[0.15em] ${
                                                        tier === 'HOT' ? 'text-orange-400' :
                                                        tier === 'WARM' ? 'text-yellow-400' : 'text-slate-600'
                                                    }`}>{tier}</span>
                                                </div>
                                                {signals.length > 0 && (
                                                    <div className="space-y-0.5">
                                                        {signals.slice(0, 2).map((s: string, idx: number) => (
                                                            <p key={idx} className="text-[8px] text-slate-500 italic leading-tight truncate" title={s}>
                                                                · {s}
                                                            </p>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })() : (
                                        <span className="text-[8px] text-slate-700 italic">Pending</span>
                                    )}
                                </td>
                                <td className="p-3 font-bold text-slate-300 italic tracking-tighter">
                                    {lead.year || lead.title.match(/\b(19|20)\d{2}\b/)?.[0] || '---'}
                                </td>
                                <td className="p-3">
                                    <div className="flex items-center gap-1 text-[8px] text-indigo-400 font-black uppercase tracking-widest italic">
                                        <MapPin size={8} />
                                        <span className="truncate">{lead.city || lead.location || 'N/A'}</span>
                                    </div>
                                </td>
                                <td className="p-3">
                                    <div className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-black italic tracking-tighter border ${
                                        lead.title_status?.toLowerCase().includes('salvage')
                                            ? 'text-red-400 bg-red-400/5 border-red-400/10'
                                            : 'text-slate-400 bg-slate-400/5 border-white/5'
                                    }`}>
                                        {lead.title_status || 'Clean'}
                                    </div>
                                </td>
                                <td className="p-3">
                                    {(() => {
                                        const d = new Date(lead.post_time);
                                        const isNew = (Date.now() - d.getTime()) < 6 * 3600000;
                                        const dateStr = d.toLocaleDateString('en-CA'); // YYYY-MM-DD
                                        const timeStr = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
                                        return (
                                            <div className="space-y-0.5">
                                                <div className="flex items-center gap-1.5">
                                                    <Clock size={9} className={isNew ? 'text-emerald-400' : 'text-indigo-500'} />
                                                    <span className={`font-black text-[8px] tabular-nums ${isNew ? 'text-emerald-400' : 'text-slate-400'}`}>{dateStr}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 pl-3.5">
                                                    <span className="text-slate-600 text-[8px] font-black">/</span>
                                                    <span className={`text-[8px] font-black ${isNew ? 'text-emerald-400' : 'text-slate-500'}`}>{timeStr}</span>
                                                    {isNew && <span className="px-1 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[7px] font-black text-emerald-400 uppercase tracking-widest">NEW</span>}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </td>
                                <td className="p-3">
                                    <select
                                        value={lead.status}
                                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onStatusChange(lead.id, e.target.value as Lead['status'])}
                                        className="w-full bg-slate-950 border border-white/5 rounded py-1 pl-2 pr-6 text-[8px] font-black focus:ring-1 focus:ring-indigo-500/50 cursor-pointer text-slate-400 uppercase tracking-[0.1em] italic appearance-none transition-all hover:border-indigo-500/30"
                                    >
                                        {['New', 'Contacted', 'Negotiating', 'Meeting Set', 'Bought', 'Dead'].map(s => (
                                            <option key={s} value={s} className="bg-slate-950">{s}</option>
                                        ))}
                                    </select>
                                </td>
                                <td className="p-3">
                                    {(() => {
                                        const d = new Date(lead.created_at);
                                        const dateStr = d.toLocaleDateString('en-CA');
                                        const timeStr = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
                                        return (
                                            <div className="space-y-0.5">
                                                <div className="flex items-center gap-1.5">
                                                    <Clock size={9} className="text-emerald-500" />
                                                    <span className="font-black text-[8px] text-slate-400 tabular-nums">{dateStr}</span>
                                                </div>
                                                <div className="pl-3.5 flex items-center gap-1.5">
                                                    <span className="text-slate-600 text-[8px] font-black">/</span>
                                                    <span className="text-[8px] font-black text-slate-500">{timeStr}</span>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </td>
                                <td className="p-3 text-right pr-8">
                                    <div className="flex justify-end gap-1">
                                        <button
                                            onClick={() => onAction?.(lead.id, 'contact')}
                                            className="p-2 bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600 hover:text-white rounded border border-indigo-500/20 transition-all active:scale-90"
                                            title="Initiate Contact"
                                        >
                                            <MessageSquare size={12} />
                                        </button>
                                        <button
                                            onClick={() => onAction?.(lead.id, 'telegram')}
                                            className="p-2 bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white rounded border border-blue-500/20 transition-all active:scale-90"
                                            title="Blast to Admin"
                                        >
                                            <Send size={12} />
                                        </button>
                                        <button
                                            onClick={() => onDelete?.(lead.id)}
                                            className="p-2 bg-red-600/10 text-red-400 hover:bg-red-600 hover:text-white rounded border border-red-500/20 transition-all active:scale-90"
                                            title="Purge Node"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {leads.length === 0 && (
                <div className="p-20 text-center space-y-4">
                    <div className="w-16 h-16 bg-slate-950 rounded-2xl border border-white/5 flex items-center justify-center mx-auto text-slate-800">
                        <Zap size={32} />
                    </div>
                    <p className="text-slate-600 font-black uppercase text-[9px] tracking-[0.3em] italic">Listing Node Empty</p>
                </div>
            )}
        </div>
    );
};
