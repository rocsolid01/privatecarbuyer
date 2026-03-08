import React from 'react';
import { Lead } from '@/types/database';
import { MapPin, DollarSign, TrendingUp, ArrowRight, ExternalLink, Car } from 'lucide-react';

interface PipelineProps {
    leads: Lead[];
    onStatusChange: (leadId: string, newStatus: Lead['status']) => void;
}

const STAGES: Lead['status'][] = ['New', 'Contacted', 'Negotiating', 'Meeting Set', 'Bought', 'Dead'];

export const Pipeline: React.FC<PipelineProps> = ({ leads, onStatusChange }: PipelineProps) => {
    return (
        <div className="flex gap-8 overflow-x-auto pb-12 min-h-[700px] scrollbar-thin scrollbar-thumb-slate-800">
            {STAGES.map((stage: Lead['status']) => {
                const stageLeads = leads.filter((l: Lead) => l.status === stage);

                return (
                    <div key={stage} className="flex-shrink-0 w-80 glass-card bg-slate-950/20 rounded-[2.5rem] border border-white/5 flex flex-col shadow-2xl relative overflow-hidden group">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-950/40 rounded-t-[2.5rem] relative">
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent"></div>
                            <h3 className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-400 flex items-center gap-3 italic">
                                <span className={`w-2.5 h-2.5 rounded-full shadow-[0_0_12px_rgba(255,255,255,0.2)] ${stage === 'New' ? 'bg-indigo-500 animate-pulse glow-indigo' :
                                    stage === 'Contacted' ? 'bg-blue-400 glow-blue' :
                                        stage === 'Negotiating' ? 'bg-amber-400 glow-amber' :
                                            stage === 'Meeting Set' ? 'bg-emerald-400 glow-emerald' :
                                                stage === 'Bought' ? 'bg-emerald-600 glow-emerald' :
                                                    'bg-slate-600'
                                    }`} />
                                {stage}
                            </h3>
                            <span className="bg-slate-900/60 text-slate-500 text-[9px] font-black px-3 py-1 rounded-full border border-white/5 italic">
                                {stageLeads.length}
                            </span>
                        </div>

                        <div className="p-4 space-y-4 flex-1 overflow-y-auto max-h-[750px] scrollbar-none">
                            {stageLeads.length === 0 ? (
                                <div className="h-32 border-2 border-dashed border-white/5 rounded-[2rem] flex flex-col items-center justify-center opacity-20 transform scale-95 transition-transform group-hover:scale-100">
                                    <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center mb-3">
                                        <ArrowRight size={16} className="text-slate-600" />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">No Active Deals</p>
                                </div>
                            ) : (
                                stageLeads.map((lead: Lead) => (
                                    <div key={lead.id} className="glass-card bg-slate-900/40 p-5 rounded-[2rem] border border-white/5 shadow-lg hover:shadow-indigo-500/10 hover:border-indigo-500/30 hover:-translate-y-1 transition-all duration-300 group/card relative overflow-hidden">
                                        <div className="absolute -right-4 -top-4 opacity-[0.02] group-hover/card:opacity-[0.08] transition-opacity pointer-events-none">
                                            <Car size={80} className="text-white" />
                                        </div>

                                        <div className="flex justify-between items-start mb-4">
                                            <h4 className="font-black text-xs text-white uppercase italic tracking-tighter leading-tight line-clamp-2 max-w-[85%]">{lead.title}</h4>
                                            <a href={lead.url} target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-indigo-400 transition-colors">
                                                <ExternalLink size={14} />
                                            </a>
                                        </div>

                                        <div className="flex items-center justify-between mb-4">
                                            {/* <div className="flex flex-col">
                                                <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest italic mb-1">Asking Price</span>
                                                <span className="text-white font-black text-lg italic tracking-tighter">
                                                    <span className="text-[10px] text-indigo-500 mr-0.5">$</span>
                                                    {lead.price?.toLocaleString()}
                                                </span>
                                            </div> */}
                                            {/* {lead.ai_margin_est && (
                                                <div className="text-right">
                                                    <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest italic mb-1">Profit Est.</span>
                                                    <div className="text-emerald-500 font-black text-sm italic tracking-tighter flex items-center justify-end gap-1">
                                                        <TrendingUp size={12} />
                                                        +${Math.round(lead.ai_margin_est / 1000)}k
                                                    </div>
                                                </div>
                                            )} */}
                                        </div>

                                        <div className="flex items-center gap-2 mb-4 text-[9px] text-slate-500 font-black uppercase tracking-[0.1em] italic">
                                            <MapPin size={10} className="text-indigo-500" />
                                            <span className="truncate">{lead.location?.split(',')[0]}</span>
                                        </div>

                                        <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-3">
                                            <select
                                                value={lead.status}
                                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onStatusChange(lead.id, e.target.value as Lead['status'])}
                                                className="text-[9px] font-black bg-slate-950/60 border border-white/5 rounded-xl py-2 pl-3 pr-8 focus:ring-1 focus:ring-indigo-500/50 cursor-pointer text-slate-400 uppercase tracking-widest italic appearance-none flex-1"
                                            >
                                                {STAGES.map(s => <option key={s} value={s} className="bg-slate-950 text-slate-400">{s}</option>)}
                                            </select>
                                            <button className="w-8 h-8 flex items-center justify-center bg-indigo-600/10 text-indigo-500 rounded-xl hover:bg-indigo-600 hover:text-white transition-all border border-indigo-500/20 shadow-lg shadow-indigo-500/5 group-hover/card:scale-105">
                                                <ArrowRight size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
