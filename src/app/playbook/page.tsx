"use client";

import { Navbar } from '@/components/Navbar';
import { Sliders, Clock, Target, Zap, MessageSquare, ArrowRight, Maximize2, Filter, BookOpen, TrendingUp } from 'lucide-react';

const workflowSteps = [
    'Check ERR tab',
    'Run Pulse',
    'Sort by AI Score',
    'Filter < 48h old',
    'Call HOT sellers first',
    'Update statuses',
    'Repeat',
];


function AiScoreBadge({ score, margin }: { score: number; margin: string }) {
    return (
        <div className="flex items-center gap-1.5 flex-wrap">
            <span className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[9px] font-black px-2.5 py-1 rounded-lg tabular-nums">
                {score}/100
            </span>
            <span className="bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[9px] font-black px-2.5 py-1 rounded-lg">
                ↗ {margin}
            </span>
        </div>
    );
}

function IntentBadge({ score, tier }: { score: number; tier: string }) {
    const color = tier === 'HOT' ? 'text-orange-400 border-orange-500/30 bg-orange-500/10'
        : tier === 'WARM' ? 'text-amber-400 border-amber-500/30 bg-amber-500/10'
        : tier === 'DEALER' ? 'text-red-400 border-red-500/30 bg-red-500/10'
        : 'text-slate-500 border-white/10 bg-white/5';
    return (
        <span className={`border text-[9px] font-black px-2.5 py-1 rounded-lg tabular-nums ${color}`}>
            {score}/100 {tier}
        </span>
    );
}

export default function PlaybookPage() {
    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-indigo-500/30">
            <Navbar />

            <main className="max-w-5xl mx-auto px-6 lg:px-12 py-12 space-y-16">

                {/* Header */}
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-8 bg-indigo-600 rounded-full" />
                        <h1 className="text-4xl font-bold uppercase tracking-tighter text-white">
                            Operator <span className="text-indigo-500">Playbook</span>
                        </h1>
                    </div>
                    <p className="text-slate-500 font-bold uppercase text-xs tracking-[0.2em] ml-5">
                        Step-by-step mission guide · Tactical Listing · Filters & Scoring
                    </p>
                </div>

                {/* Daily Workflow Strip */}
                <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6">
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] mb-4">Daily Workflow Loop</p>
                    <div className="flex flex-wrap items-center gap-2">
                        {workflowSteps.map((step, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-white uppercase tracking-wider bg-slate-800 border border-white/5 px-4 py-2 rounded-xl">
                                    {step}
                                </span>
                                {i < workflowSteps.length - 1 && <ArrowRight size={12} className="text-slate-700 shrink-0" />}
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── SECTION: Tactical Listing Controls ── */}
                <section className="space-y-8">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-6 bg-indigo-600 rounded-full" />
                        <h2 className="text-2xl font-black uppercase tracking-tighter italic text-white">Tactical Listing — Controls</h2>
                    </div>

                    {/* Controls bar mockup */}
                    <div className="bg-[#0c1018] border border-white/10 rounded-2xl p-5 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <span className="text-xl font-black uppercase tracking-tighter italic text-white">Tactical Listing</span>
                                <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] font-black px-3 py-1 rounded-full tracking-widest uppercase italic">1000 Nodes Online</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(99,102,241,0.4)]">
                                    <Sliders size={13} />
                                    Filter Data
                                </div>
                                <div className="p-2.5 bg-slate-900 border border-white/5 rounded-xl text-slate-400">
                                    <Maximize2 size={16} />
                                </div>
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium leading-relaxed border-t border-white/5 pt-4">
                            <span className="text-white font-black">Filter Data</span> — opens the filter panel to narrow down listings by price, mileage, year, city, margin, title status, and how recently they were posted.<br />
                            <span className="text-white font-black">Maximize</span> — expands the table to fullscreen so you can work through more rows without scrolling the rest of the page.
                        </p>
                    </div>

                    {/* Posted filters */}
                    <div className="bg-[#0c1018] border border-white/10 rounded-2xl p-5 space-y-4">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Inline Date Filters — always visible above the table</p>
                        <div className="flex flex-wrap gap-6">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sky-400">
                                    <Filter size={12} />
                                    <span className="text-[9px] font-black uppercase tracking-widest">Posted Date</span>
                                </div>
                                <p className="text-[11px] text-slate-400 font-medium max-w-xs">Set a from/to date range. Use this to see only listings that appeared during a specific window — e.g. this week's inventory only.</p>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sky-400">
                                    <Filter size={12} />
                                    <span className="text-[9px] font-black uppercase tracking-widest">Posted Within</span>
                                </div>
                                <p className="text-[11px] text-slate-400 font-medium max-w-xs">Type a number of hours (e.g. <span className="text-white font-black">48</span>) to show only listings posted within the last 48 hours. <span className="text-amber-400 font-black">This is your most important daily filter</span> — fresh listings have the least competition.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── SECTION: Column Sorting ── */}
                <section className="space-y-8">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-6 bg-indigo-600 rounded-full" />
                        <h2 className="text-2xl font-black uppercase tracking-tighter italic text-white">Column Sorting</h2>
                    </div>

                    <div className="bg-[#0c1018] border border-white/10 rounded-2xl p-5 space-y-5">
                        <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                            <span className="text-white font-black">Click any column title</span> once to sort highest → lowest. Click it again to flip to lowest → highest. An arrow appears next to the active sort column.
                        </p>

                        {/* Column header mockup */}
                        <div className="overflow-x-auto">
                            <div className="flex text-[8px] font-black uppercase tracking-widest text-slate-500 border-b border-white/5 pb-2 gap-0 min-w-[700px]">
                                {[
                                    { label: 'Target Ident', w: 'w-[22%]', note: '' },
                                    { label: 'Price', w: 'w-[8%]', note: '' },
                                    { label: 'Mileage', w: 'w-[8%]', note: '' },
                                    { label: 'AI Score ↑', w: 'w-[16%]', note: 'active', highlight: true },
                                    { label: 'Seller Intent', w: 'w-[12%]', note: '' },
                                    { label: 'Year', w: 'w-[6%]', note: '' },
                                    { label: 'City', w: 'w-[10%]', note: '' },
                                    { label: 'Posted', w: 'w-[10%]', note: '' },
                                ].map((col, i) => (
                                    <div key={i} className={`${col.w} px-2 flex items-center gap-1 ${col.highlight ? 'text-indigo-400' : ''}`}>
                                        {col.label}
                                        {col.highlight && <span className="text-indigo-400 text-[10px]">↓</span>}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                            {[
                                { col: 'AI Score', tip: 'Default sort. Best deals at top. Sort high → low every morning.', color: 'text-emerald-400' },
                                { col: 'Seller Intent', tip: 'Sort high → low to put the most motivated sellers at top. HOT = call today.', color: 'text-orange-400' },
                                { col: 'Posted', tip: 'Sort newest first to see the freshest listings before other buyers call.', color: 'text-sky-400' },
                                { col: 'Price', tip: 'Sort low → high to spot underpriced vehicles instantly.', color: 'text-white' },
                                { col: 'Mileage', tip: 'Sort low → high to find low-mileage deals at the top.', color: 'text-white' },
                                { col: 'Margin', tip: 'Sort high → low to prioritize highest estimated profit first.', color: 'text-white' },
                            ].map((item, i) => (
                                <div key={i} className="flex gap-3 bg-slate-900/60 border border-white/5 rounded-xl px-4 py-3">
                                    <div className="flex items-center gap-1 shrink-0">
                                        <span className="text-slate-600 text-[10px] leading-none">↑↓</span>
                                    </div>
                                    <div>
                                        <span className={`text-[10px] font-black uppercase tracking-wider ${item.color}`}>{item.col}</span>
                                        <p className="text-[10px] text-slate-500 font-medium mt-0.5">{item.tip}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── SECTION: AI Score ── */}
                <section className="space-y-8">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-6 bg-emerald-500 rounded-full" />
                        <h2 className="text-2xl font-black uppercase tracking-tighter italic text-white">AI Score Column</h2>
                    </div>

                    <div className="bg-[#0c1018] border border-white/10 rounded-2xl p-5 space-y-6">
                        <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                            The AI Score is the engine's overall judgment of how good the <span className="text-white font-black">deal</span> is — not just the car. It factors in price vs. market average, mileage for the year, vehicle history (NHTSA), and seller signals. The margin estimate next to it shows your expected profit.
                        </p>

                        {/* Badge anatomy */}
                        <div className="flex flex-wrap items-center gap-4 py-4 border-y border-white/5">
                            <AiScoreBadge score={85} margin="$2,500" />
                            <div className="space-y-1">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">How to read it</p>
                                <p className="text-[10px] text-slate-400"><span className="text-emerald-400 font-black">85/100</span> = deal quality score · <span className="text-sky-400 font-black">↗ $2,500</span> = estimated profit after recon</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {[
                                { range: '80 – 100', label: 'Strong Deal', desc: 'Price is meaningfully below market. Low risk. Call immediately.', color: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400' },
                                { range: '60 – 79', label: 'Decent Deal', desc: 'Worth a look. Negotiate hard — there\'s room but it\'s not a slam dunk.', color: 'border-amber-500/30 bg-amber-500/5 text-amber-400' },
                                { range: 'Below 60', label: 'Thin / Pass', desc: 'Margin is tight or data is missing. Skip unless you have a specific reason.', color: 'border-slate-700 bg-slate-900/40 text-slate-500' },
                            ].map((tier, i) => (
                                <div key={i} className={`border rounded-xl px-4 py-4 space-y-1.5 ${tier.color}`}>
                                    <span className="text-[11px] font-black tabular-nums">{tier.range}</span>
                                    <p className={`text-[10px] font-black uppercase tracking-wide`}>{tier.label}</p>
                                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{tier.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── SECTION: Seller Intent ── */}
                <section className="space-y-8">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-6 bg-orange-500 rounded-full" />
                        <h2 className="text-2xl font-black uppercase tracking-tighter italic text-white">Seller Intent Column</h2>
                    </div>

                    <div className="bg-[#0c1018] border border-white/10 rounded-2xl p-5 space-y-6">
                        <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                            Seller Intent measures only <span className="text-white font-black">how motivated the seller is to sell fast</span> — completely separate from whether the deal is good. A high intent score means the seller has urgency signals in their listing: moving, financial pressure, price drops, days sitting unsold.
                        </p>

                        {/* Tier badge examples */}
                        <div className="flex flex-wrap gap-3 py-4 border-y border-white/5">
                            <IntentBadge score={78} tier="HOT" />
                            <IntentBadge score={52} tier="WARM" />
                            <IntentBadge score={8} tier="COLD" />
                            <IntentBadge score={0} tier="DEALER" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {[
                                { tier: 'HOT', score: '70+', color: 'border-orange-500/30 bg-orange-500/5 text-orange-400', action: 'Call today. Seller has urgency — price is negotiable and they want it gone. These convert fastest.' },
                                { tier: 'WARM', score: '40–69', color: 'border-amber-500/30 bg-amber-500/5 text-amber-400', action: 'Worth contacting. May need 2–3 touches before they negotiate. Good for follow-up pipeline.' },
                                { tier: 'COLD', score: 'Below 40', color: 'border-slate-700 bg-slate-900/40 text-slate-400', action: 'Low motivation. Seller is likely firm on price. Only pursue if the AI Score is very high.' },
                                { tier: 'DEALER', score: '—', color: 'border-red-500/30 bg-red-500/5 text-red-400', action: 'Commercial dealer listing. Skip — no motivated private seller dynamic, prices are fixed.' },
                            ].map((item, i) => (
                                <div key={i} className={`border rounded-xl px-4 py-4 space-y-1.5 ${item.color}`}>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-black">{item.tier}</span>
                                        <span className="text-[9px] font-black opacity-60">{item.score}</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed">{item.action}</p>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-start gap-3 bg-orange-500/5 border border-orange-500/15 rounded-xl px-4 py-3">
                            <Zap size={13} className="text-orange-500 shrink-0 mt-0.5" />
                            <p className="text-[10px] font-black text-orange-400/80 uppercase tracking-wider italic">
                                What drives a HOT score: "must sell", "moving out of state", "divorce", "estate sale", "deployed", "need cash fast", price dropped since posting, listing age 30+ days, OBO / make offer language.
                            </p>
                        </div>
                    </div>
                </section>

                {/* ── SECTION: Using Both Together ── */}
                <section className="space-y-8">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-6 bg-indigo-600 rounded-full" />
                        <h2 className="text-2xl font-black uppercase tracking-tighter italic text-white">Using Both Scores Together</h2>
                    </div>

                    <div className="bg-[#0c1018] border border-white/10 rounded-2xl overflow-hidden">
                        <div className="grid grid-cols-3 text-[8px] font-black uppercase tracking-widest text-slate-600 border-b border-white/5 px-5 py-3">
                            <span>AI Score</span>
                            <span>Seller Intent</span>
                            <span>What To Do</span>
                        </div>
                        {[
                            { ai: 'High (80+)', intent: 'HOT', action: 'Call immediately. Best possible combination — great deal + motivated seller.', aiColor: 'text-emerald-400', intentColor: 'text-orange-400', actionColor: 'text-white', bg: 'bg-emerald-500/5' },
                            { ai: 'High (80+)', intent: 'COLD', action: 'Good deal but seller may be firm. Low offer, expect pushback. Still worth calling.', aiColor: 'text-emerald-400', intentColor: 'text-slate-400', actionColor: 'text-slate-300', bg: '' },
                            { ai: 'Medium (60–79)', intent: 'HOT', action: 'Motivated seller, decent deal. Negotiate hard — urgency gives you leverage.', aiColor: 'text-amber-400', intentColor: 'text-orange-400', actionColor: 'text-slate-300', bg: '' },
                            { ai: 'Medium (60–79)', intent: 'COLD', action: 'Thin deal + unmotivated seller. Move on unless nothing better in the queue.', aiColor: 'text-amber-400', intentColor: 'text-slate-400', actionColor: 'text-slate-500', bg: '' },
                            { ai: 'Low (< 60)', intent: 'HOT', action: 'Motivated but the numbers don\'t work. Skip or make a very low-ball offer.', aiColor: 'text-slate-500', intentColor: 'text-orange-400', actionColor: 'text-slate-500', bg: '' },
                            { ai: 'Low (< 60)', intent: 'COLD', action: 'Pass. No deal and no leverage.', aiColor: 'text-slate-500', intentColor: 'text-slate-500', actionColor: 'text-red-500/60', bg: '' },
                        ].map((row, i) => (
                            <div key={i} className={`grid grid-cols-3 gap-4 px-5 py-3.5 border-b border-white/5 last:border-0 ${row.bg}`}>
                                <span className={`text-[10px] font-black ${row.aiColor}`}>{row.ai}</span>
                                <span className={`text-[10px] font-black ${row.intentColor}`}>{row.intent}</span>
                                <span className={`text-[10px] font-medium ${row.actionColor}`}>{row.action}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── SECTION: Key Filters ── */}
                <section className="space-y-8">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-6 bg-sky-500 rounded-full" />
                        <h2 className="text-2xl font-black uppercase tracking-tighter italic text-white">Key Filters to Set Daily</h2>
                    </div>

                    <div className="bg-[#0c1018] border border-white/10 rounded-2xl overflow-hidden">
                        {[
                            { filter: 'Posted Within', value: '48 hrs', desc: 'Cuts anything older than 2 days. Fresh listings have less competition — other buyers haven\'t called yet.', priority: 'CRITICAL' },
                            { filter: 'Min Margin', value: '$1,500+', desc: 'Hides anything not worth your time. Set this to your actual floor — don\'t waste calls on $400 margins.', priority: 'CRITICAL' },
                            { filter: 'Title Status', value: 'Clean', desc: 'Instantly removes salvage and rebuilt titles from view. Only show cars you can flip retail.', priority: 'HIGH' },
                            { filter: 'City', value: 'Your market', desc: 'Focus on one area when you\'re ready to drive. Useful for planning your pickup day by zone.', priority: 'SITUATIONAL' },
                            { filter: 'Max Mileage', value: 'Your limit', desc: 'Filters out high-mileage inventory you won\'t buy. Keeps the table clean.', priority: 'SITUATIONAL' },
                        ].map((row, i) => (
                            <div key={i} className="flex items-start gap-4 px-5 py-4 border-b border-white/5 last:border-0">
                                <div className="w-[28%] shrink-0">
                                    <p className="text-[10px] font-black text-white uppercase tracking-wide">{row.filter}</p>
                                    <p className="text-[9px] font-black text-indigo-400 mt-0.5">{row.value}</p>
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed">{row.desc}</p>
                                </div>
                                <span className={`text-[7px] font-black uppercase tracking-widest px-2 py-1 rounded-lg shrink-0 ${
                                    row.priority === 'CRITICAL' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                    row.priority === 'HIGH' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                    'bg-slate-800 text-slate-600 border border-white/5'
                                }`}>{row.priority}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Steps (existing ones) */}
                <section className="space-y-8">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-6 bg-indigo-600 rounded-full" />
                        <h2 className="text-2xl font-black uppercase tracking-tighter italic text-white">Setup & Operations</h2>
                    </div>

                    <div className="space-y-5">
                        {[
                            {
                                number: '01', icon: Sliders, iconColor: 'text-indigo-400',
                                title: 'Configure Your Hunt', subtitle: 'Settings Page — do this once, refine over time',
                                bullets: [
                                    { label: 'Makes / Models / Year / Price / Mileage', desc: 'Locks the scraper to only cars you\'d actually buy. Tight filters = less noise, faster decisions.' },
                                    { label: 'Locations + Radius', desc: 'Set your home city first. The engine scrapes outward city by city.' },
                                    { label: 'Margin Min', desc: 'Set your floor ($1,500+). Anything below gets silently dropped before it reaches the table.' },
                                    { label: 'Motivation Keywords', desc: '"Must sell", "moving", "estate" boost seller intent scoring. Add your own based on what converts.' },
                                    { label: 'Active Hours', desc: 'Scraper only fires during this window. Prevents rate-limiting and keeps results fresh.' },
                                ],
                            },
                            {
                                number: '02', icon: Zap, iconColor: 'text-amber-400',
                                title: 'Run a Pulse', subtitle: 'Control Center → Manual Scan button',
                                bullets: [
                                    { label: 'Watch the Activity Log', desc: 'Bottom of Settings — live scan results: cities hit, leads found, duration, status.' },
                                    { label: '[WARN] COOLDOWN', desc: 'Craigslist rate-limited the session. Wait 15–30 min and re-run.' },
                                    { label: '[ERR] message', desc: 'Usually a proxy issue or Lambda timeout. Check the ERR filter tab in the log.' },
                                ],
                                tip: 'Auto-scan fires every 30 min during active hours. Manual Scan is for on-demand.',
                            },
                            {
                                number: '03', icon: MessageSquare, iconColor: 'text-sky-400',
                                title: 'Update Lead Status As You Work', subtitle: 'Click the status dropdown on any row',
                                bullets: [
                                    { label: 'New → Contacted → Negotiating → Meeting Set', desc: 'Move it forward as the deal progresses. Keeps your pipeline visible.' },
                                    { label: 'Bought', desc: 'Closed. Feeds the Close Rate stat on the Analytics dashboard.' },
                                    { label: 'Dead', desc: 'Gone or not worth it. Removes it from your active view.' },
                                ],
                                tip: 'Close Rate on Analytics tells you which score ranges actually close. Review weekly.',
                            },
                            {
                                number: '04', icon: Clock, iconColor: 'text-slate-400',
                                title: 'Read the Activity Log', subtitle: 'Settings Page → very bottom',
                                bullets: [
                                    { label: 'SCAN tab', desc: 'Every engine run: cities, leads found, duration, success/error.' },
                                    { label: 'LEAD tab', desc: 'Every new target ingested — title, price, mileage, city, AI score, margin.' },
                                    { label: 'ERR tab', desc: 'Anything that failed. Check after every pulse if yield seems low.' },
                                ],
                            },
                        ].map((step) => (
                            <div key={step.number} className="bg-slate-900/40 border border-white/5 rounded-3xl overflow-hidden hover:border-indigo-500/20 transition-all">
                                <div className="flex items-center gap-5 px-8 py-5 border-b border-white/5">
                                    <span className="text-5xl font-black text-white/5 leading-none tabular-nums select-none">{step.number}</span>
                                    <div className={`p-3 rounded-2xl bg-slate-950 border border-white/5 ${step.iconColor}`}>
                                        <step.icon size={18} />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-black text-white uppercase tracking-tighter italic leading-none">{step.title}</h3>
                                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mt-1">{step.subtitle}</p>
                                    </div>
                                </div>
                                <div className="px-8 py-5 space-y-3">
                                    {step.bullets.map((b, i) => (
                                        <div key={i} className="flex gap-4">
                                            <div className="w-1 shrink-0 mt-1 rounded-full bg-indigo-500/30 self-stretch" />
                                            <div>
                                                <span className="text-[11px] font-black text-white uppercase tracking-wide">{b.label}</span>
                                                <span className="text-[11px] text-slate-500 font-medium"> — {b.desc}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {'tip' in step && step.tip && (
                                        <div className="flex items-start gap-3 mt-3 pt-3 border-t border-white/5">
                                            <Zap size={12} className="text-amber-500 shrink-0 mt-0.5" />
                                            <p className="text-[10px] font-black text-amber-500/80 uppercase tracking-wider italic">{step.tip}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* AI note */}
                <div className="flex items-start gap-4 bg-indigo-500/5 border border-indigo-500/15 rounded-3xl px-8 py-6">
                    <TrendingUp size={18} className="text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-[11px] font-black text-indigo-300 uppercase tracking-widest mb-1">AI Gets Smarter Over Time</p>
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                            Market comps accumulate locally with every scrape. Scoring becomes more accurate to your specific cities and vehicles the more the engine runs. AutoTempest national pricing data is also pulled per listing to cross-reference.
                        </p>
                    </div>
                </div>

                <p className="text-center text-[8px] font-black text-slate-800 uppercase tracking-[0.4em] pb-4">
                    Private Car Buyer · Operator Playbook · Rev 2.0
                </p>
            </main>
        </div>
    );
}
