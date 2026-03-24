"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Clock, Zap, MessageSquare, Target } from 'lucide-react';

type LogEntry = {
    id: string;
    type: 'lead' | 'message' | 'system' | 'scan';
    message: string;
    timestamp: Date;
    status?: 'success' | 'info' | 'warning';
};

export const ActivityLog = () => {
    const [logs, setLogs] = useState([] as any[]);

    useEffect(() => {
        // Initial fetch of recent activity
        const fetchInitialActivity = async () => {
            const { data: leads } = await supabase
                .from('leads')
                .select('id, title, created_at')
                .order('created_at', { ascending: false })
                .limit(5);

            const { data: messages } = await supabase
                .from('messages')
                .select('id, content, direction, sent_at')
                .order('sent_at', { ascending: false })
                .limit(5);

            const { data: runs } = await supabase
                .from('scrape_runs')
                .select('id, status, created_at')
                .order('created_at', { ascending: false })
                .limit(5);

            const initialLogs: LogEntry[] = [
                ...(leads || []).map((l: any) => ({
                    id: l.id,
                    type: 'lead' as const,
                    message: `New Target Acquired: ${l.title}`,
                    timestamp: new Date(l.created_at),
                    status: 'success' as const
                })),
                ...(messages || []).map((m: any) => ({
                    id: m.id,
                    type: 'message' as const,
                    message: `${m.direction} Message: ${m.content.slice(0, 50)}...`,
                    timestamp: new Date(m.sent_at),
                    status: 'info' as const
                })),
                ...(runs || []).map((r: any) => {
                    const isStuck = r.status === 'Pending' && (new Date().getTime() - new Date(r.created_at).getTime()) > 10 * 60 * 1000;
                    return {
                        id: r.id,
                        type: 'scan' as const,
                        message: isStuck 
                            ? `Cloud Engine Offline: Node handshake timed out` 
                            : `Cloud Engine ${r.status}: Scanning system nodes...`,
                        timestamp: new Date(r.created_at),
                        status: r.status === 'Success' ? 'success' as const : (isStuck ? 'warning' as const : 'info' as const)
                    };
                })
            ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 15);

            setLogs(initialLogs);
        };

        fetchInitialActivity();

        // Subscribe to real-time events
        const channel = supabase
            .channel('activity-log')
            .on('postgres_changes' as any, { event: 'INSERT', schema: 'public', table: 'leads' }, (payload: any) => {
                const newLead = payload.new;
                setLogs((prev: LogEntry[]) => [
                    {
                        id: newLead.id,
                        type: 'lead',
                        message: `New Target Acquired: ${newLead.title}`,
                        timestamp: new Date(),
                        status: 'success'
                    },
                    ...prev
                ].slice(0, 15));
            })
            .on('postgres_changes' as any, { event: 'INSERT', schema: 'public', table: 'messages' }, (payload: any) => {
                const newMsg = payload.new;
                setLogs((prev: LogEntry[]) => [
                    {
                        id: newMsg.id,
                        type: 'message',
                        message: `${newMsg.direction} Message Sent: ${newMsg.content.slice(0, 50)}...`,
                        timestamp: new Date(),
                        status: 'info'
                    },
                    ...prev
                ].slice(0, 15));
            })
            .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'scrape_runs' }, (payload: any) => {
                const run = payload.new;
                setLogs((prev: LogEntry[]) => {
                    const filtered = prev.filter(p => p.id !== run.id);
                    const isStuck = run.status === 'Pending' && (new Date().getTime() - new Date(run.created_at).getTime()) > 10 * 60 * 1000;
                    return [
                        {
                            id: run.id,
                            type: 'scan',
                            message: isStuck 
                                ? `Cloud Engine Offline: Node handshake timed out` 
                                : `Cloud Engine ${run.status}: Scanning system nodes...`,
                            timestamp: new Date(run.created_at),
                            status: run.status === 'Success' ? 'success' : (isStuck ? 'warning' : 'info')
                        },
                        ...filtered
                    ].slice(0, 15);
                });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const getIcon = (type: LogEntry['type']) => {
        switch (type) {
            case 'lead': return <Target size={14} className="text-emerald-400" />;
            case 'message': return <MessageSquare size={14} className="text-indigo-400" />;
            case 'scan': return <Zap size={14} className="text-amber-400" />;
            default: return <Zap size={14} className="text-slate-400" />;
        }
    };

    return (
        <section className="glass-card p-10 rounded-[3rem] shadow-2xl border border-white/5 relative overflow-hidden mt-16">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-900 rounded-2xl border border-white/5 text-slate-400">
                        <Clock size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white uppercase tracking-tighter italic">Engine Activity Log</h2>
                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em]">Real-time Dealership Intelligence Stream</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Live Sync Alpha</span>
                </div>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {logs.length === 0 ? (
                    <div className="py-12 text-center">
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">No recent activity detected</p>
                    </div>
                ) : (
                    logs.map((log: LogEntry) => (
                        <div key={log.id} className="flex items-center gap-4 p-4 bg-slate-950/40 border border-white/5 rounded-2xl group hover:bg-slate-950/60 transition-all">
                            <div className="p-2 bg-slate-900 rounded-xl group-hover:scale-110 transition-transform">
                                {getIcon(log.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-black text-slate-300 uppercase tracking-tight truncate group-hover:text-white transition-colors">
                                    {log.message}
                                </p>
                            </div>
                            <div className="text-right whitespace-nowrap">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">
                                    {log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </p>
                                <p className="text-[8px] font-black text-slate-700 uppercase tracking-widest opacity-60">
                                    {log.timestamp.toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="mt-8 pt-6 border-t border-white/5 text-center">
                <p className="text-[8px] font-black text-slate-700 uppercase tracking-[0.5em] animate-pulse">Scanning system nodes for high-margin discrepancies...</p>
            </div>
        </section>
    );
};
