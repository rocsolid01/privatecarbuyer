"use client";

import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Terminal } from 'lucide-react';

type LogLevel = 'OK' | 'INFO' | 'WARN' | 'ERR' | 'SYS';
type LogType = 'lead' | 'message' | 'scan' | 'system';

type LogEntry = {
    id: string;
    type: LogType;
    raw: string;
    timestamp: Date;
    level: LogLevel;
};

type FilterTab = 'ALL' | 'SCAN' | 'LEAD' | 'MSG' | 'ERR';

function formatDuration(start: string, end: string | null): string {
    if (!end) return 'running...';
    const ms = new Date(end).getTime() - new Date(start).getTime();
    const secs = Math.floor(ms / 1000);
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return mins > 0 ? `${mins}m ${remSecs}s` : `${secs}s`;
}

function formatTs(d: Date): string {
    return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function buildRunLine(r: any): string {
    const citiesList = (r.cities || []);
    const citiesStr = citiesList.slice(0, 4).join(', ') + (citiesList.length > 4 ? ` +${citiesList.length - 4} more` : '');
    const dur = formatDuration(r.started_at, r.finished_at);
    const leads = `${r.leads_found ?? 0} leads`;
    const errSuffix = r.error_message ? `  // ${r.error_message.slice(0, 70)}` : '';
    return `${(r.mode || 'SCAN').padEnd(12)}  cities=[${citiesStr}]  found=${leads}  dur=${dur}  status=${r.status.toUpperCase()}${errSuffix}`;
}

function buildLeadLine(l: any): string {
    const price = l.price ? `$${l.price.toLocaleString()}` : 'price=?';
    const mi = l.mileage ? `${Math.round(l.mileage / 1000)}k mi` : '';
    const city = l.city || '';
    const score = l.ai_score != null ? `  score=${l.ai_score}` : '';
    const margin = l.ai_margin != null ? `  margin=$${l.ai_margin.toLocaleString()}` : '';
    return `${l.title}  ${price}${mi ? '  ' + mi : ''}${city ? '  ' + city : ''}${score}${margin}`;
}

export const ActivityLog = () => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [filter, setFilter] = useState<FilterTab>('ALL');
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchInitialActivity = async () => {
            const [{ data: leads }, { data: messages }, { data: runs }] = await Promise.all([
                supabase
                    .from('leads')
                    .select('id, title, price, mileage, city, ai_score, ai_margin, created_at')
                    .order('created_at', { ascending: false })
                    .limit(40),
                supabase
                    .from('messages')
                    .select('id, content, direction, sent_at')
                    .order('sent_at', { ascending: false })
                    .limit(20),
                supabase
                    .from('scrape_runs')
                    .select('id, status, mode, cities, leads_found, started_at, finished_at, error_message, created_at')
                    .order('created_at', { ascending: false })
                    .limit(30),
            ]);

            const entries: LogEntry[] = [
                ...(leads || []).map((l: any) => ({
                    id: `lead-${l.id}`,
                    type: 'lead' as LogType,
                    raw: buildLeadLine(l),
                    timestamp: new Date(l.created_at),
                    level: 'OK' as LogLevel,
                })),
                ...(messages || []).map((m: any) => ({
                    id: `msg-${m.id}`,
                    type: 'message' as LogType,
                    raw: `[${m.direction.toUpperCase()}]  ${m.content.slice(0, 100)}${m.content.length > 100 ? '...' : ''}`,
                    timestamp: new Date(m.sent_at),
                    level: 'INFO' as LogLevel,
                })),
                ...(runs || []).map((r: any) => ({
                    id: `run-${r.id}`,
                    type: 'scan' as LogType,
                    raw: buildRunLine(r),
                    timestamp: new Date(r.created_at),
                    level: (r.status === 'Success' ? 'OK' : r.status === 'Error' ? 'ERR' : r.status === 'Cooldown' ? 'WARN' : 'INFO') as LogLevel,
                })),
            ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 120);

            setLogs(entries);
        };

        fetchInitialActivity();

        const channel = supabase
            .channel('activity-log-v2')
            .on('postgres_changes' as any, { event: 'INSERT', schema: 'public', table: 'leads' }, (payload: any) => {
                const l = payload.new;
                setLogs(prev => [{
                    id: `lead-${l.id}`,
                    type: 'lead',
                    raw: buildLeadLine(l),
                    timestamp: new Date(),
                    level: 'OK',
                }, ...prev].slice(0, 120));
            })
            .on('postgres_changes' as any, { event: 'INSERT', schema: 'public', table: 'messages' }, (payload: any) => {
                const m = payload.new;
                setLogs(prev => [{
                    id: `msg-${m.id}`,
                    type: 'message',
                    raw: `[${m.direction.toUpperCase()}]  ${m.content.slice(0, 100)}`,
                    timestamp: new Date(),
                    level: 'INFO',
                }, ...prev].slice(0, 120));
            })
            .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'scrape_runs' }, (payload: any) => {
                const r = payload.new;
                const level = (r.status === 'Success' ? 'OK' : r.status === 'Error' ? 'ERR' : r.status === 'Cooldown' ? 'WARN' : 'INFO') as LogLevel;
                setLogs(prev => {
                    const rest = prev.filter(p => p.id !== `run-${r.id}`);
                    return [{
                        id: `run-${r.id}`,
                        type: 'scan',
                        raw: buildRunLine(r),
                        timestamp: new Date(r.created_at),
                        level,
                    }, ...rest].slice(0, 120);
                });
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    const filtered = logs.filter(l => {
        if (filter === 'ALL') return true;
        if (filter === 'SCAN') return l.type === 'scan';
        if (filter === 'LEAD') return l.type === 'lead';
        if (filter === 'MSG') return l.type === 'message';
        if (filter === 'ERR') return l.level === 'ERR' || l.level === 'WARN';
        return true;
    });

    const levelStyle = (level: LogLevel) => {
        switch (level) {
            case 'OK':   return 'text-emerald-400';
            case 'INFO': return 'text-sky-400';
            case 'WARN': return 'text-amber-400';
            case 'ERR':  return 'text-red-500';
            case 'SYS':  return 'text-slate-500';
        }
    };

    const typeTag = (type: LogType) => {
        switch (type) {
            case 'lead':    return { label: 'LEAD', cls: 'text-emerald-600' };
            case 'message': return { label: 'MSG ', cls: 'text-sky-700' };
            case 'scan':    return { label: 'SCAN', cls: 'text-violet-600' };
            default:        return { label: 'SYS ', cls: 'text-slate-700' };
        }
    };

    const tabs: FilterTab[] = ['ALL', 'SCAN', 'LEAD', 'MSG', 'ERR'];

    return (
        <section className="mt-16 pt-12 border-t border-white/5">
            {/* Section header */}
            <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-3">
                    <Terminal size={15} className="text-slate-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Engine Activity Log</span>
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[7px] font-black text-emerald-500 uppercase tracking-widest">Live Stream</span>
                    </div>
                </div>
                {/* Filter tabs */}
                <div className="flex items-center gap-0.5 bg-slate-950/60 border border-white/5 rounded-xl p-1">
                    {tabs.map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all ${
                                filter === f
                                    ? 'bg-slate-700 text-white'
                                    : 'text-slate-600 hover:text-slate-400'
                            }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Terminal window */}
            <div className="bg-[#07090f] border border-white/[0.06] rounded-2xl overflow-hidden shadow-2xl">
                {/* Title bar */}
                <div className="flex items-center gap-2 px-4 py-2.5 bg-[#0c1018] border-b border-white/[0.05]">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
                    <span className="ml-3 text-[9px] font-mono text-slate-600 tracking-wider select-none">
                        pcb-engine:~  //  real-time event stream
                    </span>
                    <span className="ml-auto text-[8px] font-mono text-slate-700 tabular-nums">
                        {filtered.length} events
                    </span>
                </div>

                {/* Log body */}
                <div
                    className="h-[480px] overflow-y-auto py-3 px-4 space-y-0 font-mono custom-scrollbar bg-[#07090f]"
                    ref={bottomRef}
                >
                    {filtered.length === 0 ? (
                        <p className="text-[10px] text-slate-700 font-mono py-4">// no events matched filter</p>
                    ) : (
                        filtered.map((log, i) => {
                            const tag = typeTag(log.type);
                            return (
                                <div
                                    key={log.id}
                                    className="flex items-baseline gap-2 hover:bg-white/[0.025] px-2 py-[2px] -mx-2 rounded group cursor-default"
                                >
                                    {/* Line number */}
                                    <span className="text-[8px] text-slate-800 shrink-0 tabular-nums w-6 text-right select-none">
                                        {filtered.length - i}
                                    </span>
                                    {/* Timestamp */}
                                    <span className="text-[9px] text-slate-700 shrink-0 tabular-nums">
                                        {formatTs(log.timestamp)}
                                    </span>
                                    {/* Level badge */}
                                    <span className={`text-[8px] font-bold shrink-0 w-10 ${levelStyle(log.level)}`}>
                                        [{log.level}]
                                    </span>
                                    {/* Type tag */}
                                    <span className={`text-[8px] font-bold shrink-0 ${tag.cls}`}>
                                        {tag.label}
                                    </span>
                                    {/* Message */}
                                    <span className="text-[9px] text-slate-400 leading-tight group-hover:text-slate-200 transition-colors whitespace-pre-wrap break-all">
                                        {log.raw}
                                    </span>
                                </div>
                            );
                        })
                    )}

                    {/* Blinking cursor */}
                    <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/[0.04]">
                        <span className="text-[9px] text-emerald-600 font-mono">pcb@engine:~$</span>
                        <span className="inline-block w-[7px] h-[11px] bg-emerald-500 animate-pulse rounded-[1px] ml-0.5" />
                    </div>
                </div>
            </div>
        </section>
    );
};
