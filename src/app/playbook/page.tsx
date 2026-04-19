"use client";

import { Navbar } from '@/components/Navbar';
import { Zap, ArrowRight, Target, TrendingUp, CheckCircle2 } from 'lucide-react';

function AiScoreBadge({ score, margin }: { score: number; margin: string }) {
    return (
        <div className="flex items-center gap-1.5">
            <span className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-black px-2.5 py-1 rounded-lg tabular-nums">{score}/100</span>
            <span className="bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[10px] font-black px-2.5 py-1 rounded-lg">↗ {margin}</span>
        </div>
    );
}

function IntentBadge({ score, tier }: { score: number; tier: string }) {
    const color = tier === 'HOT' ? 'text-orange-400 border-orange-500/30 bg-orange-500/10'
        : tier === 'WARM' ? 'text-amber-400 border-amber-500/30 bg-amber-500/10'
        : tier === 'DEALER' ? 'text-red-400 border-red-500/30 bg-red-500/10'
        : 'text-slate-500 border-white/10 bg-white/5';
    return (
        <span className={`border text-[10px] font-black px-2.5 py-1 rounded-lg tabular-nums ${color}`}>
            {score}/100 {tier}
        </span>
    );
}

export default function PlaybookPage() {
    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-indigo-500/30">
            <Navbar />
            <main className="max-w-4xl mx-auto px-6 lg:px-12 py-12 space-y-12">

                {/* Header */}
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-8 bg-indigo-600 rounded-full" />
                        <h1 className="text-4xl font-bold uppercase tracking-tighter text-white">
                            Operator <span className="text-indigo-500">Playbook</span>
                        </h1>
                    </div>
                    <p className="text-slate-500 font-bold uppercase text-xs tracking-[0.2em] ml-5">
                        How to read the Tactical Listing and act on it fast
                    </p>
                </div>

                {/* ── WHY THIS EXISTS ── */}
                <div className="bg-indigo-600/10 border border-indigo-500/25 rounded-3xl px-8 py-8 space-y-5">
                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.4em]">Why This Tool Exists</p>
                    <p className="text-lg font-black text-white uppercase tracking-tight leading-snug">
                        Stop scrolling through hundreds of listings.<br />
                        <span className="text-indigo-400">The engine does the sifting. You make the calls.</span>
                    </p>
                    <p className="text-[12px] text-slate-400 font-medium leading-relaxed max-w-2xl">
                        Every Craigslist listing in your market gets scored automatically — deal quality and seller motivation — so you only spend time on cars that are worth buying and sellers who are ready to deal.
                    </p>
                </div>

                {/* ── BENEFIT 1: AI SCORE ── */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400">
                            <Target size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tighter italic text-white">AI Score — Is This a Good Deal?</h2>
                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.25em] mt-0.5">Automatically calculated on every listing</p>
                        </div>
                    </div>

                    {/* Core benefit callout */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            { icon: CheckCircle2, color: 'text-emerald-400', title: 'Saves Hours Daily', desc: 'No more manually researching what a car is worth. The engine cross-references market data and gives you a score instantly.' },
                            { icon: CheckCircle2, color: 'text-emerald-400', title: 'Catches Underpriced Cars', desc: 'Listings priced below real market value score highest. You see the best deals before anyone else calls.' },
                            { icon: CheckCircle2, color: 'text-emerald-400', title: 'Shows Estimated Profit', desc: 'The margin figure next to the score is your estimated profit after recon — so you know if it\'s worth your time before you dial.' },
                        ].map((b, i) => (
                            <div key={i} className="bg-slate-900/40 border border-white/5 rounded-2xl px-5 py-5 space-y-2">
                                <b.icon size={14} className={b.color} />
                                <p className="text-[11px] font-black text-white uppercase tracking-wide">{b.title}</p>
                                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{b.desc}</p>
                            </div>
                        ))}
                    </div>

                    {/* Badge + tiers */}
                    <div className="bg-[#0c1018] border border-white/10 rounded-2xl p-6 space-y-5">
                        <div className="flex flex-wrap items-center gap-4 pb-5 border-b border-white/5">
                            <AiScoreBadge score={85} margin="$2,500" />
                            <p className="text-[11px] text-slate-400 font-medium">
                                <span className="text-emerald-400 font-black">85/100</span> = deal quality &nbsp;·&nbsp; <span className="text-sky-400 font-black">↗ $2,500</span> = estimated profit after recon
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {[
                                { range: '80 – 100', label: 'Strong Deal', desc: 'Price is below market. Call immediately.', color: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400' },
                                { range: '60 – 79', label: 'Decent Deal', desc: 'Worth a call. Negotiate — there\'s room.', color: 'border-amber-500/30 bg-amber-500/5 text-amber-400' },
                                { range: 'Below 60', label: 'Skip', desc: 'Thin margin or missing data. Move on.', color: 'border-slate-700 bg-slate-900/40 text-slate-500' },
                            ].map((t, i) => (
                                <div key={i} className={`border rounded-xl px-4 py-3 space-y-1 ${t.color}`}>
                                    <p className="text-[12px] font-black tabular-nums">{t.range}</p>
                                    <p className="text-[10px] font-black uppercase tracking-wide">{t.label}</p>
                                    <p className="text-[10px] text-slate-500 font-medium">{t.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── BENEFIT 2: SELLER INTENT ── */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-orange-500/10 border border-orange-500/20 rounded-2xl text-orange-400">
                            <Zap size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tighter italic text-white">Seller Intent — Are They Ready to Deal?</h2>
                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.25em] mt-0.5">Reads the seller's listing for urgency signals</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            { icon: CheckCircle2, color: 'text-emerald-400', title: 'Find Motivated Sellers', desc: 'The engine reads listing language for urgency — "must sell", "moving", "divorce", "need cash fast". You see who is desperate before you call.' },
                            { icon: CheckCircle2, color: 'text-emerald-400', title: 'Know Your Leverage', desc: 'A HOT seller will negotiate. A COLD seller won\'t budge. Knowing this before you call means you don\'t waste time on people who won\'t move on price.' },
                            { icon: CheckCircle2, color: 'text-emerald-400', title: 'Skip Dealers Automatically', desc: 'Dealer listings are flagged and excluded from intent scoring. You focus only on private sellers where you have actual negotiating power.' },
                        ].map((b, i) => (
                            <div key={i} className="bg-slate-900/40 border border-white/5 rounded-2xl px-5 py-5 space-y-2">
                                <b.icon size={14} className={b.color} />
                                <p className="text-[11px] font-black text-white uppercase tracking-wide">{b.title}</p>
                                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{b.desc}</p>
                            </div>
                        ))}
                    </div>

                    <div className="bg-[#0c1018] border border-white/10 rounded-2xl p-6 space-y-5">
                        <div className="flex flex-wrap gap-3 pb-5 border-b border-white/5">
                            <IntentBadge score={78} tier="HOT" />
                            <IntentBadge score={52} tier="WARM" />
                            <IntentBadge score={8} tier="COLD" />
                            <IntentBadge score={0} tier="DEALER" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {[
                                { tier: 'HOT  70+', color: 'border-orange-500/30 bg-orange-500/5 text-orange-400', action: 'Call today. Seller has urgency and will negotiate. These convert fastest — act before another buyer does.' },
                                { tier: 'WARM  40–69', color: 'border-amber-500/30 bg-amber-500/5 text-amber-400', action: 'Worth contacting. Some motivation present. May take 2–3 touches before they move on price.' },
                                { tier: 'COLD  Below 40', color: 'border-slate-700 bg-slate-900/40 text-slate-400', action: 'Low motivation. Seller is likely firm. Only call if the AI Score is very high.' },
                                { tier: 'DEALER', color: 'border-red-500/30 bg-red-500/5 text-red-400', action: 'Commercial lot. Skip — prices are fixed and there\'s no motivated seller dynamic to work with.' },
                            ].map((item, i) => (
                                <div key={i} className={`border rounded-xl px-4 py-4 space-y-1.5 ${item.color}`}>
                                    <p className="text-[11px] font-black tracking-wide">{item.tier}</p>
                                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed">{item.action}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── USING BOTH TOGETHER ── */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-6 bg-indigo-600 rounded-full" />
                        <h2 className="text-xl font-black uppercase tracking-tighter italic text-white">Use Both Scores Together</h2>
                    </div>
                    <div className="bg-[#0c1018] border border-white/10 rounded-2xl overflow-hidden">
                        <div className="grid grid-cols-3 text-[8px] font-black uppercase tracking-widest text-slate-600 border-b border-white/5 px-5 py-3">
                            <span>AI Score</span><span>Seller Intent</span><span>What To Do</span>
                        </div>
                        {[
                            { ai: 'High (80+)', intent: 'HOT', action: 'Call immediately. Best combination — great deal and motivated seller.', aiC: 'text-emerald-400', intC: 'text-orange-400', actC: 'text-white font-black', bg: 'bg-emerald-500/5' },
                            { ai: 'High (80+)', intent: 'COLD', action: 'Good deal but seller is firm. Still worth calling — lead with the offer.', aiC: 'text-emerald-400', intC: 'text-slate-400', actC: 'text-slate-300', bg: '' },
                            { ai: 'Medium (60–79)', intent: 'HOT', action: 'Motivated seller, decent deal. Negotiate hard — urgency is your leverage.', aiC: 'text-amber-400', intC: 'text-orange-400', actC: 'text-slate-300', bg: '' },
                            { ai: 'Medium (60–79)', intent: 'COLD', action: 'Thin deal, unmotivated seller. Move on unless your queue is empty.', aiC: 'text-amber-400', intC: 'text-slate-400', actC: 'text-slate-500', bg: '' },
                            { ai: 'Low (below 60)', intent: 'Any', action: 'Skip. The numbers don\'t work regardless of motivation.', aiC: 'text-slate-500', intC: 'text-slate-500', actC: 'text-slate-600', bg: '' },
                        ].map((row, i) => (
                            <div key={i} className={`grid grid-cols-3 gap-4 px-5 py-3.5 border-b border-white/5 last:border-0 ${row.bg}`}>
                                <span className={`text-[10px] font-black ${row.aiC}`}>{row.ai}</span>
                                <span className={`text-[10px] font-black ${row.intC}`}>{row.intent}</span>
                                <span className={`text-[10px] font-medium ${row.actC}`}>{row.action}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── SORTING & FILTERS ── */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-6 bg-indigo-600 rounded-full" />
                        <h2 className="text-xl font-black uppercase tracking-tighter italic text-white">Sorting & Filters</h2>
                    </div>

                    <div className="bg-[#0c1018] border border-white/10 rounded-2xl p-6 space-y-5">
                        <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                            <span className="text-white font-black">Click any column title</span> to sort. Click again to flip direction. The table opens sorted by AI Score highest → lowest by default.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-white/5">
                            {[
                                { col: 'AI Score ↓', tip: 'Default. Best deals at the top every time you open the table.', color: 'text-emerald-400' },
                                { col: 'Seller Intent ↓', tip: 'HOT sellers at the top. Use this to prioritize who to call first.', color: 'text-orange-400' },
                                { col: 'Posted ↓', tip: 'Newest listings first. Fresh posts have less competition from other buyers.', color: 'text-sky-400' },
                                { col: 'Margin ↓', tip: 'Highest profit potential first. Useful when you have a budget day target.', color: 'text-white' },
                            ].map((item, i) => (
                                <div key={i} className="flex gap-3 bg-slate-900/60 border border-white/5 rounded-xl px-4 py-3">
                                    <span className="text-slate-600 text-[12px] shrink-0 leading-none mt-0.5">↑↓</span>
                                    <div>
                                        <span className={`text-[10px] font-black uppercase tracking-wide ${item.color}`}>{item.col}</span>
                                        <p className="text-[10px] text-slate-500 font-medium mt-0.5">{item.tip}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Key filters */}
                    <div className="bg-[#0c1018] border border-white/10 rounded-2xl overflow-hidden">
                        <div className="px-5 py-3 border-b border-white/5">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Filter Data — Set These Every Morning</p>
                        </div>
                        {[
                            { filter: 'Posted Within', value: '48 hrs', desc: 'Only show listings from the last 2 days. Fresh = less competition from other buyers.', tag: 'CRITICAL' },
                            { filter: 'Min Margin', value: '$1,500+', desc: 'Hide anything below your profit floor. Don\'t waste calls on thin deals.', tag: 'CRITICAL' },
                            { filter: 'Title Status', value: 'Clean', desc: 'Remove salvage and rebuilt titles instantly. Only see cars you can flip retail.', tag: 'HIGH' },
                            { filter: 'City', value: 'Your market', desc: 'Focus on one area when planning a pickup day.', tag: 'AS NEEDED' },
                        ].map((row, i) => (
                            <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-white/5 last:border-0">
                                <div className="w-[30%] shrink-0">
                                    <p className="text-[10px] font-black text-white uppercase tracking-wide">{row.filter}</p>
                                    <p className="text-[9px] font-black text-indigo-400 mt-0.5">{row.value}</p>
                                </div>
                                <p className="text-[10px] text-slate-500 font-medium leading-relaxed flex-1">{row.desc}</p>
                                <span className={`text-[7px] font-black uppercase tracking-widest px-2 py-1 rounded-lg shrink-0 ${
                                    row.tag === 'CRITICAL' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                    row.tag === 'HIGH' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                    'bg-slate-800 text-slate-600 border border-white/5'
                                }`}>{row.tag}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── DAILY LOOP ── */}
                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-6 bg-indigo-600 rounded-full" />
                        <h2 className="text-xl font-black uppercase tracking-tighter italic text-white">Daily Routine</h2>
                    </div>
                    <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-5">
                        <div className="flex flex-wrap items-center gap-2">
                            {['Filter: 48h + Clean Title', 'Sort by AI Score', 'Call all HOT sellers first', 'Then WARM with high score', 'Update status after each call', 'Repeat next morning'].map((step, i, arr) => (
                                <div key={i} className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-white uppercase tracking-wider bg-slate-800 border border-white/5 px-4 py-2 rounded-xl">{step}</span>
                                    {i < arr.length - 1 && <ArrowRight size={11} className="text-slate-700 shrink-0" />}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* AI note */}
                <div className="flex items-start gap-4 bg-indigo-500/5 border border-indigo-500/15 rounded-2xl px-6 py-5">
                    <TrendingUp size={16} className="text-indigo-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                        <span className="text-indigo-300 font-black">The AI gets more accurate over time.</span> Every scrape adds to a local market database of real comps from your cities. The more the engine runs, the tighter the scoring becomes for your specific market.
                    </p>
                </div>

                <p className="text-center text-[8px] font-black text-slate-800 uppercase tracking-[0.4em] pb-4">
                    Private Car Buyer · Operator Playbook · Rev 3.0
                </p>
            </main>
        </div>
    );
}
