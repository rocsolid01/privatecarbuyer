import React from 'react';

export const LeadCardSkeleton = () => (
    <div className="bg-slate-950/40 border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl animate-pulse glass-card">
        <div className="h-48 bg-slate-900/50" />
        <div className="p-6 space-y-4">
            <div className="flex justify-between items-start">
                <div className="h-7 w-2/3 bg-slate-900/60 rounded-xl" />
                <div className="h-7 w-1/4 bg-slate-900/60 rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="h-4 w-full bg-slate-900/40 rounded-lg" />
                <div className="h-4 w-full bg-slate-900/40 rounded-lg" />
                <div className="h-4 w-full bg-slate-900/40 rounded-lg" />
                <div className="h-4 w-full bg-slate-900/40 rounded-lg" />
            </div>
            <div className="h-14 w-full bg-indigo-500/10 border border-indigo-500/10 rounded-2xl mt-6" />
        </div>
    </div>
);

export const LeadDetailSkeleton = () => (
    <div className="min-h-screen bg-[#020617] animate-pulse relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-[150px] -z-10" />

        <div className="h-20 border-b border-white/5 glass-card" />
        <div className="max-w-7xl mx-auto px-4 py-16 lg:flex gap-16 relative z-10">
            <div className="flex-1 space-y-10">
                <div className="space-y-6">
                    <div className="h-6 w-32 bg-indigo-500/10 rounded-full border border-indigo-500/10" />
                    <div className="h-16 w-3/4 bg-slate-900/60 rounded-[2rem]" />
                    <div className="h-6 w-1/2 bg-slate-900/40 rounded-xl" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-28 bg-slate-900/40 rounded-[2rem] border border-white/5" />
                    ))}
                </div>
                <div className="h-[500px] bg-slate-900/30 rounded-[3rem] border border-white/5" />
            </div>
            <div className="w-full lg:w-[450px] h-[700px] bg-slate-900/20 rounded-[3.5rem] border border-white/5 glass-card" />
        </div>
    </div>
);
