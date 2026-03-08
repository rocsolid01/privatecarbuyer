import React from 'react';
import { MapPin, Zap, DollarSign, Clock, ExternalLink, MessageSquare, Send } from 'lucide-react';
import { Lead } from '@/types/database';
import { formatDistanceToNow } from 'date-fns';
import { InfoTooltip } from './InfoTooltip';
import { TOOLTIP_CONTENT } from '@/lib/tooltip-content';

interface LeadCardProps {
    lead: Lead;
    onAction?: (id: string, action: 'contact' | 'deep_scrape' | 'telegram') => void;
    isSelected?: boolean;
    onSelect?: (id: string, selected: boolean) => void;
}

export const StatusBadge = ({ status }: { status: Lead['status'] }) => {
    const statusColors: Record<Lead['status'], string> = {
        New: 'bg-indigo-600 text-white animate-pulse glow-indigo',
        Contacted: 'bg-blue-600/40 text-blue-100 border border-blue-500/30',
        Negotiating: 'bg-amber-600/40 text-amber-100 border border-amber-500/30',
        'Meeting Set': 'bg-emerald-600/40 text-emerald-100 border border-emerald-500/30',
        Bought: 'bg-emerald-600 text-white glow-emerald',
        Dead: 'bg-slate-800 text-slate-500 border border-white/5',
    };

    return (
        <span className={`px-3 py-1 rounded-full text-[9px] font-black tracking-widest italic flex items-center gap-1 ${statusColors[status]}`}>
            {status === 'New' ? 'TARGET ACQUIRED' : status.toUpperCase()}
            <InfoTooltip content={TOOLTIP_CONTENT.STATUS_FLOW} />
        </span>
    );
};

export const LeadCard: React.FC<LeadCardProps> = ({ lead, onAction, isSelected, onSelect }: LeadCardProps) => {
    return (
        <div className="glass-card rounded-[2rem] overflow-hidden group transition-all duration-500 hover:-translate-y-1">
            <div className="relative h-48 overflow-hidden">
                {lead.photos && lead.photos[0] ? (
                    <img
                        src={lead.photos[0]}
                        alt={lead.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center border-b border-white/5 space-y-2">
                        <Zap size={32} className="text-slate-800" />
                        <span className="text-slate-800 font-black text-[9px] uppercase tracking-[0.3em] italic">Imagery Unavailable</span>
                    </div>
                )}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSelect?.(lead.id, e.target.checked)}
                        className="w-5 h-5 rounded-lg border-2 border-white/20 bg-black/40 backdrop-blur-md checked:bg-indigo-500 checked:border-indigo-500 transition-all cursor-pointer accent-indigo-500"
                    />
                    <StatusBadge status={lead.status} />
                </div>
            </div>

            <div className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                    <h3 className="font-black text-sm leading-tight line-clamp-2 text-white group-hover:text-indigo-400 transition-colors uppercase italic tracking-tighter">
                        {lead.title}
                    </h3>
                </div>

                <div className="grid grid-cols-2 gap-4 text-[10px] text-slate-500 font-black uppercase tracking-widest italic">
                    <div className="flex items-center gap-2">
                        <Zap size={12} className="text-indigo-500" />
                        <span>{lead.mileage?.toLocaleString()} <span className="text-[8px] opacity-60">MI</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                        <MapPin size={12} className="text-indigo-500" />
                        <span className="truncate">{lead.location?.split(',')[0]}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock size={12} className="text-indigo-500" />
                        <span>{formatDistanceToNow(new Date(lead.post_time))} <span className="text-[8px] opacity-60">AGO</span></span>
                    </div>
                    {lead.distance && (
                        <div className="flex items-center gap-2 text-white">
                            <MapPin size={12} className="text-emerald-500 glow-emerald" />
                            <span>{Math.round(lead.distance)} <span className="text-[8px] opacity-60">MI RADIAL</span></span>
                        </div>
                    )}
                </div>

                {lead.ai_notes && (
                    <div className="p-4 bg-indigo-600/5 border border-indigo-500/10 rounded-2xl relative overflow-hidden group/note">
                        <div className="flex items-center gap-2 mb-2">
                            <Zap size={10} className="text-amber-500" />
                            <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest italic">Engine Intelligence</span>
                            <InfoTooltip content={TOOLTIP_CONTENT.AI_NOTES} />
                        </div>
                        <p className="text-[10px] text-slate-300 italic font-bold leading-relaxed line-clamp-2">
                            "{lead.ai_notes}"
                        </p>
                    </div>
                )}

                <div className="pt-4 flex gap-2">
                    <button
                        onClick={() => onAction?.(lead.id, 'contact')}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                    >
                        <MessageSquare size={16} />
                        Sniper Contact
                    </button>
                    <button
                        onClick={() => onAction?.(lead.id, 'telegram')}
                        className="p-3 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-2xl transition-all flex items-center justify-center border border-white/5 active:scale-95"
                    >
                        <Send size={18} />
                    </button>
                    <a
                        href={lead.url}
                        target="_blank"
                        className="px-3 border border-slate-800 hover:bg-slate-800 rounded-lg flex items-center justify-center text-slate-500 transition-colors"
                    >
                        <ExternalLink size={18} />
                    </a>
                </div>
            </div>
        </div>
    );
};
