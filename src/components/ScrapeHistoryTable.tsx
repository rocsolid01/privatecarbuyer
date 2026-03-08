"use client";

import React from 'react';
import { ScrapeRun } from '@/types/database';
import { InfoTooltip } from './InfoTooltip';
import { TOOLTIP_CONTENT } from '@/lib/tooltip-content';
import {
    Clock,
    MapPin,
    Zap,
    CheckCircle2,
    AlertCircle,
    ChevronRight,
    Activity
} from 'lucide-react';

interface ScrapeHistoryTableProps {
    runs: ScrapeRun[];
}

export const ScrapeHistoryTable: React.FC<ScrapeHistoryTableProps> = ({ runs }: ScrapeHistoryTableProps) => {
    return (
        <div className="glass-card bg-slate-950/20 border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl relative">
            <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600/5 rounded-full blur-[120px] -z-10" />

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-950/60 border-b border-white/5">
                            <th className="p-8 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] whitespace-nowrap italic">
                                <div className="flex items-center gap-2">
                                    Temporal Node
                                    <InfoTooltip content={TOOLTIP_CONTENT.TEMPORAL_NODE} />
                                </div>
                            </th>
                            <th className="p-8 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] whitespace-nowrap italic">
                                <div className="flex items-center gap-2">
                                    Strategy Mode
                                    <InfoTooltip content={TOOLTIP_CONTENT.STRATEGY_MODE} />
                                </div>
                            </th>
                            <th className="p-8 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] whitespace-nowrap italic">
                                <div className="flex items-center gap-2">
                                    Target Radar
                                    <InfoTooltip content={TOOLTIP_CONTENT.TARGET_RADAR} />
                                </div>
                            </th>
                            <th className="p-8 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] whitespace-nowrap italic text-center">
                                <div className="flex items-center justify-center gap-2">
                                    Yield
                                    <InfoTooltip content={TOOLTIP_CONTENT.YIELD_STAT} />
                                </div>
                            </th>
                            <th className="p-8 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] whitespace-nowrap italic">
                                <div className="flex items-center gap-2">
                                    Status
                                    <InfoTooltip content={TOOLTIP_CONTENT.PULSE_STATUS} />
                                </div>
                            </th>
                            <th className="p-8 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] whitespace-nowrap italic text-right">Reference</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {runs.map((run) => (
                            <tr key={run.id} className="hover:bg-white/[0.03] transition-colors group/row">
                                <td className="p-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center border border-white/5 text-slate-400 group-hover/row:border-blue-500/30 transition-all">
                                            <Clock size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-white italic tracking-tighter">
                                                {new Date(run.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                            <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest italic">
                                                {new Date(run.started_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-8">
                                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest italic border ${run.mode === 'FAR SWEEP'
                                        ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                        : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                        }`}>
                                        {run.mode}
                                    </span>
                                </td>
                                <td className="p-8">
                                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold italic">
                                        <MapPin size={12} className="text-blue-500" />
                                        <span>{run.cities?.length || 0} Domains</span>
                                        <span className="text-[8px] opacity-40 uppercase font-black tracking-tighter">
                                            ({run.cities?.slice(0, 2).join(', ')}{run.cities?.length > 2 ? '...' : ''})
                                        </span>
                                    </div>
                                </td>
                                <td className="p-8 text-center">
                                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 rounded-2xl border border-white/5">
                                        <Zap size={14} className={run.leads_found > 0 ? 'text-amber-400 glow-amber' : 'text-slate-700'} />
                                        <span className={`text-lg font-black italic tracking-tighter ${run.leads_found > 0 ? 'text-white' : 'text-slate-600'}`}>
                                            {run.leads_found}
                                        </span>
                                    </div>
                                </td>
                                <td className="p-8">
                                    <div className="flex items-center gap-3">
                                        {run.status === 'Success' && (
                                            <div className="flex items-center gap-2 text-emerald-500">
                                                <CheckCircle2 size={16} />
                                                <span className="text-[9px] font-black uppercase tracking-widest italic">Success</span>
                                            </div>
                                        )}
                                        {run.status === 'Partial' && (
                                            <div className="flex items-center gap-2 text-amber-500">
                                                <AlertCircle size={16} />
                                                <span className="text-[9px] font-black uppercase tracking-widest italic">Degraded</span>
                                            </div>
                                        )}
                                        {run.status === 'Error' && (
                                            <div className="flex items-center gap-2 text-red-500">
                                                <AlertCircle size={16} />
                                                <span className="text-[9px] font-black uppercase tracking-widest italic">Failed</span>
                                            </div>
                                        )}
                                        {run.status === 'Pending' && (
                                            <div className="flex items-center gap-2 text-blue-400 animate-pulse">
                                                <Clock size={16} />
                                                <span className="text-[9px] font-black uppercase tracking-widest italic">Active</span>
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="p-8 text-right">
                                    <button className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all group/ref">
                                        <ChevronRight size={16} className="text-slate-500 group-hover/ref:translate-x-0.5 transition-transform" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {runs.length === 0 && (
                <div className="p-24 text-center">
                    <p className="text-slate-600 font-black uppercase text-[10px] tracking-[0.4em] italic mb-2">No Pulse Logs Detected</p>
                    <p className="text-[8px] text-slate-800 font-black uppercase tracking-widest italic">System awaiting first successful deployment...</p>
                </div>
            )}
        </div>
    );
};
