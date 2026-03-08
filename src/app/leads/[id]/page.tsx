"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Navbar } from '@/components/Navbar';
import { Lead } from '@/types/database';
import { StatusBadge } from '@/components/LeadCard';
import { InfoTooltip } from '@/components/InfoTooltip';
import { TOOLTIP_CONTENT } from '@/lib/tooltip-content';
import { ExternalLink, Car, Ruler, DollarSign, Calendar, MessageSquare, Send, Trash2, Archive, CheckCircle2, Zap } from 'lucide-react';
import { LeadDetailSkeleton } from '@/components/Skeletons';

export default function LeadDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [lead, setLead] = useState(null as Lead | null);
    const [messages, setMessages] = useState([] as any[]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    const handleStatusChange = async (newStatus: string) => {
        if (!lead) return;
        setUpdating(true);
        const { error } = await supabase
            .from('leads')
            .update({ status: newStatus })
            .eq('id', lead.id);

        if (!error) {
            setLead({ ...lead, status: newStatus } as Lead);
            if (newStatus === 'archived') {
                router.push('/dashboard');
            }
        }
        setUpdating(false);
    };

    const fetchLeadData = async () => {
        const { data: leadData } = await supabase
            .from('leads')
            .select('*')
            .eq('id', params.id)
            .single();

        if (leadData) {
            setLead(leadData as Lead);
            const { data: msgData } = await supabase
                .from('messages')
                .select('*')
                .eq('lead_id', params.id)
                .order('created_at', { ascending: true });
            setMessages(msgData || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchLeadData();
        const channel = supabase
            .channel(`lead-chat-${params.id}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages', filter: `lead_id=eq.${params.id}` },
                (payload: any) => {
                    setMessages((prev: any[]) => [...prev, payload.new]);
                }
            )
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [params.id]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !lead) return;
        const body = { leadId: lead.id, content: newMessage };
        setNewMessage('');
        try {
            const res = await fetch('/api/sms/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            if (!res.ok) throw new Error('Failed to send message');
        } catch (err: any) {
            alert(err.message);
        }
    };

    if (loading) return <LeadDetailSkeleton />;
    if (!lead) return <div className="p-20 text-center">Lead Not Found</div>;

    return (
        <div className="min-h-screen bg-[#020617] text-slate-50 relative overflow-hidden">
            <Navbar />
            <main className="max-w-[1400px] mx-auto px-6 py-12 relative z-10">
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
                    <div className="xl:col-span-8 space-y-12">
                        <section className="glass-card rounded-[3rem] overflow-hidden shadow-2xl border border-white/5">
                            <div className="aspect-video w-full bg-slate-950/40 relative">
                                {lead.photos?.[0] ? (
                                    <img src={lead.photos[0]} alt={lead.title} className="w-full h-full object-contain" />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-slate-700 italic">Imagery Offline</div>
                                )}
                            </div>
                        </section>

                        <section className="glass-card p-12 rounded-[3.5rem] shadow-2xl border border-white/5">
                            <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <StatusBadge status={lead.status} />
                                        <div className="flex items-center gap-3 ml-4">
                                            <button onClick={() => handleStatusChange('Contacted')} className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl border border-emerald-500/20"><CheckCircle2 size={18} /></button>
                                            <button onClick={() => handleStatusChange('Archived')} className="p-3 bg-slate-800/40 text-slate-500 rounded-2xl border border-white/5"><Archive size={18} /></button>
                                        </div>
                                    </div>
                                    <h1 className="text-6xl font-black text-white leading-none tracking-tighter italic uppercase">{lead.title}</h1>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 py-12 border-y border-white/5">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Utilization</p>
                                        <InfoTooltip content={TOOLTIP_CONTENT.MILEAGE_CAP} />
                                    </div>
                                    <p className="text-3xl font-black text-white flex items-center gap-3 italic tracking-tighter">
                                        <Ruler size={24} className="text-indigo-500" />
                                        {lead.mileage?.toLocaleString()} <span className="text-xs text-slate-500 font-black uppercase">MI</span>
                                    </p>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Vintage</p>
                                        <InfoTooltip content={TOOLTIP_CONTENT.YEAR_THRESHOLD} />
                                    </div>
                                    <p className="text-3xl font-black text-white flex items-center gap-3 italic tracking-tighter">
                                        <Calendar size={24} className="text-indigo-500" />
                                        {new Date(lead.post_time).getFullYear()}
                                    </p>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Distance</p>
                                        <InfoTooltip content={TOOLTIP_CONTENT.SEARCH_RADIUS} />
                                    </div>
                                    <p className="text-3xl font-black text-white flex items-center gap-3 italic tracking-tighter">
                                        <Car size={24} className="text-indigo-500" />
                                        {Math.round(lead.distance || 0)} <span className="text-xs text-slate-500 font-black uppercase">MI</span>
                                    </p>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Market Velocity</p>
                                        <InfoTooltip content={TOOLTIP_CONTENT.LEAD_SCORE} />
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1 h-3 bg-slate-900 rounded-full overflow-hidden border border-white/5 p-[2px]">
                                            <div className="h-full bg-emerald-500 glow-emerald rounded-full" style={{ width: '85%' }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-16 space-y-10">
                                <div className="flex items-center gap-4">
                                    <div className="w-1 h-10 bg-indigo-600 rounded-full"></div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-black text-xl uppercase tracking-tighter text-white italic">Neural Strategy Review</h3>
                                        <InfoTooltip content={TOOLTIP_CONTENT.AI_NOTES} />
                                    </div>
                                </div>
                                <div className="p-12 bg-slate-950/80 rounded-[3rem] border-2 border-indigo-500/20 relative">
                                    <p className="text-lg text-slate-200 font-bold italic">
                                        <span className="font-black text-indigo-500 mr-4 tracking-[0.3em] text-[10px] uppercase">Engine Intelligence:</span>
                                        "{lead.ai_notes}"
                                    </p>
                                </div>
                            </div>
                        </section>
                    </div>

                    <div className="xl:col-span-4">
                        <div className="glass-card rounded-[3.5rem] shadow-2xl flex flex-col h-[850px] sticky top-32 overflow-hidden border border-white/5">
                            <div className="p-10 border-b border-white/5 bg-slate-950/40">
                                <p className="font-black text-xl text-white uppercase tracking-tighter italic">Sniper Interface</p>
                            </div>
                            <div className="flex-1 overflow-y-auto p-10 space-y-10">
                                {messages.map((msg: any, i: number) => (
                                    <div key={i} className={`flex flex-col ${msg.sender_type === 'dealer' ? 'items-end' : 'items-start'}`}>
                                        <div className={`max-w-[90%] p-6 rounded-[2rem] text-sm font-bold shadow-2xl ${msg.sender_type === 'dealer' ? 'bg-indigo-600 text-white italic' : 'bg-slate-900/60 text-slate-200'}`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <form onSubmit={handleSendMessage} className="p-10 border-t border-white/5 bg-slate-950/40">
                                <div className="relative">
                                    <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Transmit Message..." className="w-full bg-slate-950 border-2 border-white/5 rounded-[2rem] py-8 pl-8 pr-24 text-white font-black text-xs uppercase" />
                                    <button type="submit" disabled={!newMessage.trim()} className="absolute right-3 top-3 bottom-3 px-8 bg-indigo-600 text-white rounded-[1.5rem]"><Send size={24} /></button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
