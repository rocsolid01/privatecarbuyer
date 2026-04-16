"use client";

import { Navbar } from '@/components/Navbar';
import { BookOpen, Settings, Filter, Maximize2, Terminal, Target, TrendingUp, Zap, MessageSquare, Clock, ArrowRight, Flame } from 'lucide-react';

type Step = {
    number: string;
    icon: React.ElementType;
    iconColor: string;
    title: string;
    subtitle: string;
    bullets: { label: string; desc: string }[];
    tip?: string;
};

const steps: Step[] = [
    {
        number: '01',
        icon: Settings,
        iconColor: 'text-indigo-400',
        title: 'Configure Your Hunt',
        subtitle: 'Settings Page — do this once, refine over time',
        bullets: [
            { label: 'Makes / Models / Year / Price / Mileage', desc: 'Locks the scraper to only cars you\'d actually buy. Tight filters = less noise, faster decisions.' },
            { label: 'Locations + Radius', desc: 'Set your home city first. The engine scrapes outward from there city by city.' },
            { label: 'Margin Min', desc: 'Minimum estimated profit to even flag a lead. Set your floor ($1,500+). Anything below gets silently dropped.' },
            { label: 'Motivation Keywords', desc: 'Words like "must sell", "moving", "estate" boost seller intent scoring. Add your own based on what you\'ve seen convert.' },
            { label: 'Active Hours', desc: 'Scraper only fires during this window. Prevents rate-limiting and keeps results fresh for your day.' },
        ],
    },
    {
        number: '02',
        icon: BookOpen,
        iconColor: 'text-violet-400',
        title: 'Save a Config Template',
        subtitle: 'Settings Page → Save Template',
        bullets: [
            { label: 'Name by use case', desc: '"Daily Hunt", "Weekend Sweep", "Trucks Only" — load back in one click.' },
            { label: 'Why it matters', desc: 'Prevents accidental misconfiguration before a pulse. Swap between strategies instantly.' },
        ],
        tip: 'Save a template before changing anything. You\'ll want to go back.',
    },
    {
        number: '03',
        icon: Zap,
        iconColor: 'text-amber-400',
        title: 'Run a Pulse',
        subtitle: 'Control Center header → Manual Scan button',
        bullets: [
            { label: 'Watch the Activity Log', desc: 'Bottom of the page — shows live scan results: cities hit, leads found, duration, status.' },
            { label: '[WARN] COOLDOWN', desc: 'Craigslist rate-limited the session. Wait 15–30 min and re-run.' },
            { label: '[ERR] message', desc: 'Usually a proxy connection issue or Lambda timeout. Check the ERR filter tab in the log.' },
        ],
        tip: 'The auto-scan fires every 30 min during your active hours. Manual Scan is for on-demand checks.',
    },
    {
        number: '04',
        icon: Target,
        iconColor: 'text-emerald-400',
        title: 'Work the Tactical Listing',
        subtitle: 'Analytics or Settings → Tactical Listing table',
        bullets: [
            { label: 'Sort by AI Score first', desc: 'Highest deal quality at the top. Score = composite of price vs market, mileage, NHTSA data, seller signals.' },
            { label: 'Seller Intent: HOT (orange, 70+)', desc: 'Urgency signals detected — moving, cash only, price drops. Prioritize these even over higher AI scores with cold sellers.' },
            { label: 'Posted column — exact age', desc: '"2h ago", "1d 4h ago". Anything under 6h gets a NEW badge. Hit those first — less competition.' },
            { label: 'Filter Data button', desc: 'Set Max Days Old (24–48h) to cut stale listings. Set Min Margin to only show deals worth calling.' },
            { label: 'AI Score vs Margin', desc: 'Score = deal quality. Margin = estimated profit. A 90-score / $500 margin is a pass. A 72-score / $4k margin is a call.' },
        ],
    },
    {
        number: '05',
        icon: MessageSquare,
        iconColor: 'text-sky-400',
        title: 'Update Lead Status As You Work',
        subtitle: 'Click the status dropdown on any row',
        bullets: [
            { label: 'New', desc: 'Just scraped, haven\'t evaluated yet.' },
            { label: 'Contacted → Negotiating → Meeting Set', desc: 'Move it forward as the deal progresses. Keeps your pipeline clear.' },
            { label: 'Bought', desc: 'Closed. Feeds the Close Rate stat on the Analytics dashboard.' },
            { label: 'Dead', desc: 'Gone or not worth it. Gets it out of your active view.' },
        ],
        tip: 'Close Rate on the dashboard tells you which score ranges actually close. Track it weekly.',
    },
    {
        number: '06',
        icon: Terminal,
        iconColor: 'text-slate-400',
        title: 'Read the Activity Log',
        subtitle: 'Settings Page → bottom of page',
        bullets: [
            { label: 'SCAN tab', desc: 'Every engine run: cities, leads found, duration, success/error. Confirms the engine is firing.' },
            { label: 'LEAD tab', desc: 'Every new target ingested — title, price, mileage, city, AI score, estimated margin.' },
            { label: 'ERR tab', desc: 'Anything that failed. Check this after every pulse if yield seems low.' },
        ],
    },
];

const workflowSteps = [
    'Check ERR tab',
    'Run Pulse',
    'Sort by Seller Intent HOT',
    'Filter < 48h old',
    'Call top 5',
    'Update statuses',
    'Repeat',
];

export default function PlaybookPage() {
    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-indigo-500/30">
            <Navbar />

            <main className="max-w-5xl mx-auto px-6 lg:px-12 py-12">

                {/* Header */}
                <div className="mb-14 space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-8 bg-indigo-600 rounded-full" />
                        <h1 className="text-4xl font-bold uppercase tracking-tighter text-white">
                            Operator <span className="text-indigo-500">Playbook</span>
                        </h1>
                    </div>
                    <p className="text-slate-500 font-bold uppercase text-xs tracking-[0.2em] ml-5">
                        Step-by-step mission guide for Private Car Buyer
                    </p>
                </div>

                {/* Daily Workflow Strip */}
                <div className="mb-14 bg-slate-900/40 border border-white/5 rounded-3xl p-6">
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] mb-4">Daily Workflow Loop</p>
                    <div className="flex flex-wrap items-center gap-2">
                        {workflowSteps.map((step, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-white uppercase tracking-wider bg-slate-800 border border-white/5 px-4 py-2 rounded-xl">
                                    {step}
                                </span>
                                {i < workflowSteps.length - 1 && (
                                    <ArrowRight size={12} className="text-slate-700 shrink-0" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Steps */}
                <div className="space-y-6">
                    {steps.map((step) => (
                        <div key={step.number} className="bg-slate-900/40 border border-white/5 rounded-3xl overflow-hidden hover:border-indigo-500/20 transition-all">
                            {/* Step header */}
                            <div className="flex items-center gap-5 px-8 py-6 border-b border-white/5">
                                <span className="text-5xl font-black text-white/5 leading-none tabular-nums select-none">{step.number}</span>
                                <div className={`p-3 rounded-2xl bg-slate-950 border border-white/5 ${step.iconColor}`}>
                                    <step.icon size={20} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-white uppercase tracking-tighter italic leading-none">
                                        {step.title}
                                    </h2>
                                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mt-1">
                                        {step.subtitle}
                                    </p>
                                </div>
                            </div>

                            {/* Bullets */}
                            <div className="px-8 py-6 space-y-4">
                                {step.bullets.map((b, i) => (
                                    <div key={i} className="flex gap-4">
                                        <div className="w-1 shrink-0 mt-1 rounded-full bg-indigo-500/30 self-stretch" />
                                        <div>
                                            <span className="text-[11px] font-black text-white uppercase tracking-wide">{b.label}</span>
                                            <span className="text-[11px] text-slate-500 font-medium"> — {b.desc}</span>
                                        </div>
                                    </div>
                                ))}

                                {step.tip && (
                                    <div className="flex items-start gap-3 mt-4 pt-4 border-t border-white/5">
                                        <Flame size={13} className="text-amber-500 shrink-0 mt-0.5" />
                                        <p className="text-[10px] font-black text-amber-500/80 uppercase tracking-wider italic">{step.tip}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* AI learns over time note */}
                <div className="mt-10 flex items-start gap-4 bg-indigo-500/5 border border-indigo-500/15 rounded-3xl px-8 py-6">
                    <TrendingUp size={18} className="text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-[11px] font-black text-indigo-300 uppercase tracking-widest mb-1">AI Gets Smarter Over Time</p>
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                            Market comps accumulate locally with every scrape. Scoring becomes more accurate to your specific cities and target vehicles the more the engine runs. AutoTempest data is also pulled per listing to cross-reference national pricing.
                        </p>
                    </div>
                </div>

                <p className="text-center text-[8px] font-black text-slate-800 uppercase tracking-[0.4em] mt-14 pb-4">
                    Private Car Buyer · Operator Playbook · Rev 1.0
                </p>
            </main>
        </div>
    );
}
