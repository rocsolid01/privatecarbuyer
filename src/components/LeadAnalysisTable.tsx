"use client";

import React from 'react';
import { Lead } from '@/types/database';
import {
    ExternalLink,
    MessageSquare,
    Trash2,
    TrendingUp,
    MapPin,
    Zap
} from 'lucide-react';
import Link from 'next/link';
import { StatusBadge } from './LeadCard';

interface LeadAnalysisTableProps {
    leads: Lead[];
    onStatusChange: (id: string, status: Lead['status']) => void;
    onDelete?: (id: string) => void;
}

export const LeadAnalysisTable: React.FC<LeadAnalysisTableProps> = ({
    leads,
    onStatusChange,
    onDelete
}: LeadAnalysisTableProps) => {
    return (
        <div className="glass-card bg-slate-950/20 border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 rounded-full blur-[100px] -z-10" />

            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-800">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-950/60 border-b border-white/5">
                            <th className="p-8 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] whitespace-nowrap italic">Origin & Detail</th>
                            <th className="p-8 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] whitespace-nowrap italic">Vehicle Spec</th>
                            {/* <th className="p-8 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] whitespace-nowrap italic text-center">Liquidity</th>
                            <th className="p-8 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] whitespace-nowrap italic">Neural Signals</th> */}
                            <th className="p-8 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] whitespace-nowrap italic text-center">Protocol</th>
                            <th className="p-8 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] whitespace-nowrap italic">Status</th>
                            <th className="p-8 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] whitespace-nowrap italic text-right">Operations</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {leads.map((lead: Lead) => (
                            <tr key={lead.id} className="hover:bg-white/[0.03] transition-colors group/row">
                                <td className="p-8">
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 bg-slate-950 rounded-2xl overflow-hidden flex-shrink-0 border border-white/5 group-hover/row:border-indigo-500/30 transition-all">
                                            {lead.photos?.[0] ? (
                                                <img src={lead.photos[0]} alt="" className="w-full h-full object-cover group-hover/row:scale-110 transition-transform duration-500" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-700 italic font-black text-[10px]">N/A</div>
                                            )}
                                        </div>
                                        <div className="min-w-[200px] max-w-[350px]">
                                            <Link
                                                href={`/leads/${lead.id}`}
                                                className="font-black text-sm text-white hover:text-indigo-400 italic uppercase tracking-tighter block leading-none mb-2 transition-colors"
                                            >
                                                {lead.title}
                                            </Link>
                                            <div className="flex items-center gap-2 text-[8px] text-slate-500 font-black uppercase tracking-[0.2em] italic">
                                                <MapPin size={10} className="text-indigo-500" />
                                                <span className="truncate">{lead.location}</span>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-8">
                                    <div className="space-y-2">
                                        <p className="text-sm font-black text-white italic tracking-tighter">{new Date(lead.post_time).getFullYear()}</p>
                                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest italic">{lead.mileage?.toLocaleString()} <span className="text-[8px] opacity-60">MI</span></p>
                                    </div>
                                </td>
                                {/* <td className="p-8 text-center">
                                    <div className="space-y-1">
                                        <p className="text-xl font-black text-indigo-500 italic tracking-tighter">
                                            <span className="text-xs mr-0.5">$</span>
                                            {lead.price?.toLocaleString()}
                                        </p>
                                        <p className="text-[8px] text-slate-600 font-black uppercase tracking-[0.3em] italic">Listing</p>
                                    </div>
                                </td> */}
                                {/* <td className="p-8">
                                    <div className="flex gap-8">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-emerald-500 glow-emerald">
                                                <TrendingUp size={16} />
                                                <span className="text-lg font-black italic tracking-tighter">
                                                    <span className="text-[10px] mr-0.5">$</span>
                                                    {lead.ai_margin_est?.toLocaleString()}
                                                </span>
                                            </div>
                                            <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest italic ml-6">Margin</p>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-indigo-400">
                                                <Zap size={16} />
                                                <span className="text-lg font-black italic tracking-tighter">
                                                    <span className="text-[10px] mr-0.5">$</span>
                                                    {lead.ai_recon_est?.toLocaleString()}
                                                </span>
                                            </div>
                                            <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest italic ml-6">Recon</p>
                                        </div>
                                    </div>
                                </td> */}
                                <td className="p-8 text-center">
                                    <Link
                                        href={`/leads/${lead.id}`}
                                        className="inline-flex items-center gap-3 bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600 hover:text-white p-3 px-6 rounded-2xl border border-indigo-500/20 transition-all group/btn"
                                    >
                                        <MessageSquare size={16} className="group-hover/btn:scale-110 transition-transform" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">History</span>
                                    </Link>
                                </td>
                                <td className="p-8">
                                    <select
                                        value={lead.status}
                                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onStatusChange(lead.id, e.target.value as Lead['status'])}
                                        className="bg-slate-950 border border-white/5 rounded-xl py-2 pl-3 pr-8 text-[10px] font-black focus:ring-1 focus:ring-indigo-500/50 cursor-pointer text-slate-400 uppercase tracking-widest italic appearance-none transition-all hover:border-indigo-500/30"
                                    >
                                        {['New', 'Contacted', 'Negotiating', 'Meeting Set', 'Bought', 'Dead'].map(s => (
                                            <option key={s} value={s} className="bg-slate-950">{s}</option>
                                        ))}
                                    </select>
                                </td>
                                <td className="p-8 text-right">
                                    <div className="flex justify-end gap-3">
                                        <button
                                            onClick={() => onDelete?.(lead.id)}
                                            className="p-3 text-slate-600 hover:text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-xl transition-all"
                                            title="Purge Lead"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                        <a
                                            href={lead.url}
                                            target="_blank"
                                            className="p-3 text-slate-600 hover:text-indigo-400 hover:bg-indigo-400/10 border border-transparent hover:border-indigo-400/20 rounded-xl transition-all"
                                        >
                                            <ExternalLink size={18} />
                                        </a>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {leads.length === 0 && (
                <div className="p-32 text-center space-y-6">
                    <div className="w-24 h-24 bg-slate-950 rounded-[2rem] border border-white/5 flex items-center justify-center mx-auto text-slate-800 shadow-2xl">
                        <Zap size={48} />
                    </div>
                    <p className="text-slate-600 font-black uppercase text-[10px] tracking-[0.4em] italic leading-loose">Awaiting Deployment: Node Empty</p>
                </div>
            )}
        </div>
    );
};
