"use client";

import { Navbar } from '@/components/Navbar';
import { Zap, ArrowRight, Target, TrendingUp, CheckCircle2 } from 'lucide-react';

// Matches the exact AI Score column badge format in the real table
function AiScoreBadge({ score, margin }: { score: number; margin: string }) {
    return (
        <div className="flex items-center gap-1.5 flex-wrap">
            <span className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-black italic px-2 py-0.5 rounded-md tabular-nums">
                ↑ {score}/100
            </span>
            <span className="bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[10px] font-black italic px-2 py-0.5 rounded-md">
                ↗ {margin}
            </span>
        </div>
    );
}

// Matches the exact Seller Intent column badge format in the real table
function IntentBadge({ score }: { score: number }) {
    const isHot = score >= 70;
    const isWarm = score >= 40 && score < 70;
    const icon = isHot ? '🔥' : isWarm ? '⚡' : '·';
    const badgeStyle = isHot
        ? 'bg-orange-500/15 border-orange-500/40 text-orange-400'
        : isWarm
        ? 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400'
        : 'bg-slate-500/10 border-white/5 text-slate-500';
    const labelStyle = isHot ? 'text-orange-400' : isWarm ? 'text-yellow-400' : 'text-slate-600';
    const label = isHot ? 'HOT' : isWarm ? 'WARM' : 'COLD';
    return (
        <div className="flex items-center gap-1.5">
            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-md border font-black italic text-[10px] tracking-widest ${badgeStyle}`}>
                <span>{icon}</span>
                <span>{score}/100</span>
            </span>
            <span className={`text-[9px] font-black uppercase tracking-widest ${labelStyle}`}>{label}</span>
        </div>
    );
}

// Sample table row matching the real tactical listing appearance
function SampleRow({ title, price, mileage, aiScore, margin, intentScore, year, signal }: {
    title: string; price: string; mileage: string; aiScore: number; margin: string;
    intentScore: number; year: string; signal?: string;
}) {
    const isHot = intentScore >= 70;
    const isWarm = intentScore >= 40 && intentScore < 70;
    const icon = isHot ? '🔥' : isWarm ? '⚡' : '·';
    const badgeStyle = isHot ? 'bg-orange-500/15 border-orange-500/40 text-orange-400'
        : isWarm ? 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400'
        : 'bg-slate-500/10 border-white/5 text-slate-500';
    const labelStyle = isHot ? 'text-orange-400' : isWarm ? 'text-yellow-400' : 'text-slate-600';
    const label = isHot ? 'HOT' : isWarm ? 'WARM' : 'COLD';

    return (
        <div className="grid grid-cols-[2fr_80px_80px_160px_140px_60px] gap-2 items-center px-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/[0.02] text-[10px]">
            <div className="font-bold text-slate-300 truncate uppercase tracking-tight">{title}</div>
            <div>
                <div className="font-black text-white">{price}</div>
                <div className="text-[8px] text-slate-600 uppercase">List Price</div>
            </div>
            <div className="text-slate-400 font-medium tabular-nums">{mileage} <span className="text-[8px] text-slate-600">mi</span></div>
            <div className="space-y-1">
                <div className="flex items-center gap-1">
                    <span className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[9px] font-black italic px-2 py-0.5 rounded-md">{aiScore}/100</span>
                    <span className="bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[9px] font-black italic px-2 py-0.5 rounded-md">↗ {margin}</span>
                </div>
            </div>
            <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-md border font-black italic text-[9px] ${badgeStyle}`}>
                        <span>{icon}</span><span>{intentScore}/100</span>
                    </span>
                    <span className={`text-[8px] font-black uppercase ${labelStyle}`}>{label}</span>
                </div>
                {signal && <p className="text-[8px] text-slate-600 italic">· {signal}</p>}
            </div>
            <div className="text-slate-500 font-bold">{year}</div>
        </div>
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

                {/* Why this exists */}
                <div className="bg-indigo-600/10 border border-indigo-500/25 rounded-3xl px-8 py-8 space-y-4">
                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.4em]">Why This Tool Exists</p>
                    <p className="text-lg font-black text-white uppercase tracking-tight leading-snug">
                        Stop scrolling through hundreds of listings.<br />
                        <span className="text-indigo-400">The engine does the sifting. You make the calls.</span>
                    </p>
                    <p className="text-[12px] text-slate-400 font-medium leading-relaxed max-w-2xl">
                        Every Craigslist listing in your market gets scored automatically — deal quality and seller motivation — so you only spend time on cars worth buying and sellers ready to deal.
                    </p>
                </div>

                {/* ── AI SCORE ── */}
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

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            { title: 'Saves Hours Daily', desc: 'No more manually researching what a car is worth. The engine cross-references market data and gives you a score instantly.' },
                            { title: 'Catches Underpriced Cars', desc: 'Listings priced below real market value score highest. You see the best deals before anyone else calls.' },
                            { title: 'Shows Estimated Profit', desc: 'The blue number next to the score is your estimated profit after recon — before you even pick up the phone.' },
                        ].map((b, i) => (
                            <div key={i} className="bg-slate-900/40 border border-white/5 rounded-2xl px-5 py-5 space-y-2">
                                <CheckCircle2 size={14} className="text-emerald-400" />
                                <p className="text-[11px] font-black text-white uppercase tracking-wide">{b.title}</p>
                                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{b.desc}</p>
                            </div>
                        ))}
                    </div>

                    <div className="bg-[#0c1018] border border-white/10 rounded-2xl p-6 space-y-5">
                        {/* Badge example matching real table */}
                        <div className="flex flex-wrap items-center gap-4 pb-5 border-b border-white/5">
                            <AiScoreBadge score={85} margin="$2,500" />
                            <p className="text-[11px] text-slate-400 font-medium">
                                <span className="text-emerald-400 font-black">85/100</span> = deal quality score &nbsp;·&nbsp; <span className="text-sky-400 font-black">↗ $2,500</span> = estimated profit after recon
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {[
                                { range: '80 – 100', label: 'Strong Deal', desc: 'Price is below market. Call immediately.', color: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400' },
                                { range: '60 – 79', label: 'Decent Deal', desc: 'Worth a call. Negotiate — there\'s room.', color: 'border-amber-500/30 bg-amber-500/5 text-amber-400' },
                                { range: 'Below 60', label: 'Skip', desc: 'Thin margin or data missing. Move on.', color: 'border-slate-700 bg-slate-900/40 text-slate-500' },
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

                {/* ── SELLER INTENT ── */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-orange-500/10 border border-orange-500/20 rounded-2xl text-orange-400">
                            <Zap size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tighter italic text-white">Seller Intent — Are They Ready to Deal?</h2>
                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.25em] mt-0.5">Score out of 100 — the higher, the more motivated the seller</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            { title: 'Find Motivated Sellers', desc: 'Reads the listing text for urgency — "must sell", "moving", "divorce", "need cash fast". You know who is desperate before you call.' },
                            { title: 'Know Your Leverage', desc: 'A high intent score means the seller will negotiate. A low score means they won\'t budge. Know this before you dial.' },
                            { title: 'Dealers Auto-Flagged', desc: 'Commercial dealer listings are detected and scored separately so you stay focused on private sellers where you have real leverage.' },
                        ].map((b, i) => (
                            <div key={i} className="bg-slate-900/40 border border-white/5 rounded-2xl px-5 py-5 space-y-2">
                                <CheckCircle2 size={14} className="text-emerald-400" />
                                <p className="text-[11px] font-black text-white uppercase tracking-wide">{b.title}</p>
                                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{b.desc}</p>
                            </div>
                        ))}
                    </div>

                    <div className="bg-[#0c1018] border border-white/10 rounded-2xl p-6 space-y-5">
                        {/* Badge examples matching the exact real table format */}
                        <div className="flex flex-wrap gap-4 pb-5 border-b border-white/5">
                            <IntentBadge score={78} />
                            <IntentBadge score={52} />
                            <IntentBadge score={5} />
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium">This is exactly what you see in the Seller Intent column. The number is the score — the icon and color tell you the urgency level at a glance.</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {[
                                { icon: '🔥', range: '70 – 100', label: 'Urgent Seller', color: 'border-orange-500/30 bg-orange-500/5 text-orange-400', desc: 'Call today. Seller has urgency and will negotiate. These convert fastest.' },
                                { icon: '⚡', range: '40 – 69', label: 'Some Motivation', color: 'border-yellow-500/30 bg-yellow-500/5 text-yellow-400', desc: 'Worth contacting. May take a couple of touches before they move on price.' },
                                { icon: '·', range: 'Below 40', label: 'No Urgency', color: 'border-slate-700 bg-slate-900/40 text-slate-500', desc: 'Seller is firm. Only call if the AI Score is very high.' },
                            ].map((t, i) => (
                                <div key={i} className={`border rounded-xl px-4 py-3 space-y-1.5 ${t.color}`}>
                                    <div className="flex items-center gap-2">
                                        <span className="text-base">{t.icon}</span>
                                        <span className="text-[12px] font-black tabular-nums">{t.range}</span>
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-wide">{t.label}</p>
                                    <p className="text-[10px] text-slate-500 font-medium">{t.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── LIVE TABLE SAMPLE ── */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-6 bg-indigo-600 rounded-full" />
                        <h2 className="text-xl font-black uppercase tracking-tighter italic text-white">What You See in the Table</h2>
                    </div>
                    <div className="bg-[#0c1018] border border-white/10 rounded-2xl overflow-hidden">
                        {/* Column headers matching real table */}
                        <div className="grid grid-cols-[2fr_80px_80px_160px_140px_60px] gap-2 px-4 py-2.5 border-b border-white/10 text-[8px] font-black uppercase tracking-widest text-slate-600 bg-[#0d1117]">
                            <span>Target Ident</span>
                            <span>Price</span>
                            <span>Mileage</span>
                            <span>AI Score ↓</span>
                            <span>Seller Intent</span>
                            <span>Year</span>
                        </div>
                        <SampleRow title="2016 BMW M235i Coupe Rare *6 S..." price="$19,800" mileage="106,900" aiScore={85} margin="$3,200" intentScore={74} year="2016" signal="Must sell — relocating" />
                        <SampleRow title="2014 Jeep Cherokee Limited Edi..." price="$7,800" mileage="90,850" aiScore={85} margin="$1,700" intentScore={52} year="2014" signal="OBO, make offer" />
                        <SampleRow title="Hyundai Elantra SE Sedan" price="$7,200" mileage="79,442" aiScore={85} margin="$1,000" intentScore={2} year="—" />
                        <SampleRow title="2015 Nissan Xterra V6" price="$12,500" mileage="93,000" aiScore={85} margin="$1,500" intentScore={6} year="2015" signal="Title in hand" />
                        {/* Legend callouts */}
                        <div className="px-4 py-4 border-t border-white/5 bg-slate-900/30 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">AI Score column</p>
                                <p className="text-[10px] text-slate-400 font-medium">Green number = deal quality. Blue number = estimated profit. Higher green = better deal.</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Seller Intent column</p>
                                <p className="text-[10px] text-slate-400 font-medium">🔥 orange = urgent seller (70+). ⚡ yellow = some motivation (40–69). · gray = no urgency (below 40).</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Signal lines below score</p>
                                <p className="text-[10px] text-slate-400 font-medium">The small italic text under the score shows what triggered it — "must sell", "title in hand", "OBO", etc.</p>
                            </div>
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
                        <div className="grid grid-cols-3 text-[8px] font-black uppercase tracking-widest text-slate-600 border-b border-white/5 px-5 py-3 bg-[#0d1117]">
                            <span>AI Score</span><span>Seller Intent Score</span><span>What To Do</span>
                        </div>
                        {[
                            { ai: '80 – 100', intent: '70 – 100 🔥', action: 'Call immediately. Best combination — great deal and urgent seller.', aiC: 'text-emerald-400', intC: 'text-orange-400', actC: 'text-white font-black', bg: 'bg-emerald-500/5' },
                            { ai: '80 – 100', intent: 'Below 40 ·', action: 'Good deal but seller is firm. Still worth calling — lead with the offer.', aiC: 'text-emerald-400', intC: 'text-slate-500', actC: 'text-slate-300', bg: '' },
                            { ai: '60 – 79', intent: '70 – 100 🔥', action: 'Motivated seller, decent deal. Negotiate hard — urgency is your leverage.', aiC: 'text-amber-400', intC: 'text-orange-400', actC: 'text-slate-300', bg: '' },
                            { ai: '60 – 79', intent: 'Below 40 ·', action: 'Thin deal, unmotivated seller. Move on unless your queue is empty.', aiC: 'text-amber-400', intC: 'text-slate-500', actC: 'text-slate-500', bg: '' },
                            { ai: 'Below 60', intent: 'Any', action: 'Skip. The numbers don\'t work regardless of how motivated the seller is.', aiC: 'text-slate-500', intC: 'text-slate-500', actC: 'text-slate-600', bg: '' },
                        ].map((row, i) => (
                            <div key={i} className={`grid grid-cols-3 gap-4 px-5 py-3.5 border-b border-white/5 last:border-0 ${row.bg}`}>
                                <span className={`text-[10px] font-black tabular-nums ${row.aiC}`}>{row.ai}</span>
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
                            <span className="text-white font-black">Click any column title</span> to sort. Click again to flip. The table always opens sorted by AI Score highest → lowest.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-white/5">
                            {[
                                { col: 'AI Score ↓', tip: 'Default. Best deals at the top every time you open the table.', color: 'text-emerald-400' },
                                { col: 'Seller Intent ↓', tip: 'Highest intent score at top — sorts by number, not label. 78 before 52 before 5.', color: 'text-orange-400' },
                                { col: 'Posted ↓', tip: 'Newest listings first. Fresh posts have the least competition.', color: 'text-sky-400' },
                                { col: 'Margin ↓', tip: 'Highest estimated profit first. Use when you have a daily budget target.', color: 'text-white' },
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

                    <div className="bg-[#0c1018] border border-white/10 rounded-2xl overflow-hidden">
                        <div className="px-5 py-3 border-b border-white/5 bg-[#0d1117]">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Filter Data — Set These Every Morning</p>
                        </div>
                        {[
                            { filter: 'Posted Within', value: '48 hrs', desc: 'Only show listings from the last 2 days. Fresh = less competition from other buyers.', tag: 'CRITICAL' },
                            { filter: 'Min Margin', value: '$1,500+', desc: 'Hide anything below your profit floor. Don\'t waste calls on thin deals.', tag: 'CRITICAL' },
                            { filter: 'Title Status', value: 'Clean', desc: 'Remove salvage and rebuilt titles. Only see cars you can flip retail.', tag: 'HIGH' },
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

                {/* ── DAILY ROUTINE ── */}
                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-6 bg-indigo-600 rounded-full" />
                        <h2 className="text-xl font-black uppercase tracking-tighter italic text-white">Daily Routine</h2>
                    </div>
                    <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-5">
                        <div className="flex flex-wrap items-center gap-2">
                            {['Filter: 48h + Clean Title', 'Sort by AI Score', 'Look for 🔥 in Seller Intent', 'Call those first', 'Update status after each call', 'Repeat next morning'].map((step, i, arr) => (
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
                        <span className="text-indigo-300 font-black">The AI gets more accurate over time.</span> Every scrape adds to a local market database of real comps from your cities. The longer the engine runs, the tighter the scoring gets for your specific market.
                    </p>
                </div>

                <p className="text-center text-[8px] font-black text-slate-800 uppercase tracking-[0.4em] pb-4">
                    Private Car Buyer · Operator Playbook · Rev 4.0
                </p>
            </main>
        </div>
    );
}
