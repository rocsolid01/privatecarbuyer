"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Lead } from '@/types/database';
import { Zap, X, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const NotificationCenter = () => {
    const [notifications, setNotifications] = useState<Lead[]>([]);

    useEffect(() => {
        const channel = supabase
            .channel('new-leads-alerts')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'leads' },
                (payload) => {
                    const newLead = payload.new as Lead;
                    if ((newLead.ai_margin_est || 0) > 2000) {
                        setNotifications((prev) => [newLead, ...prev]);

                        // Auto-remove after 8 seconds
                        setTimeout(() => {
                            setNotifications((prev) => prev.filter(n => n.id !== newLead.id));
                        }, 8000);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    if (notifications.length === 0) return null;

    return (
        <div className="fixed top-20 right-4 z-[100] flex flex-col gap-3 w-80 pointer-events-none">
            {notifications.map((lead) => (
                <div
                    key={lead.id}
                    className="bg-white dark:bg-slate-900 border-2 border-emerald-500 rounded-2xl p-4 shadow-2xl pointer-events-auto animate-in slide-in-from-right-8 duration-500"
                >
                    <div className="flex justify-between items-start mb-2">
                        <div className="bg-emerald-100 dark:bg-emerald-900/40 p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400">
                            <Zap size={18} fill="currentColor" />
                        </div>
                        <button
                            onClick={() => setNotifications(prev => prev.filter(n => n.id !== lead.id))}
                            className="text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                    <h4 className="font-black text-slate-900 dark:text-white text-sm leading-tight mb-1">
                        High Margin Deal Found!
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                        {lead.title}
                    </p>
                    <div className="flex items-center justify-between">
                        <span className="text-emerald-600 font-bold text-sm">
                            Est. ${lead.ai_margin_est?.toLocaleString()} Margin
                        </span>
                        <Link
                            href={`/leads/${lead.id}`}
                            className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 p-1.5 rounded-lg hover:scale-110 transition-transform"
                        >
                            <ArrowRight size={14} />
                        </Link>
                    </div>
                </div>
            ))}
        </div>
    );
};
