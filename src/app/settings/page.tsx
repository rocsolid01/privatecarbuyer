"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Navbar } from '@/components/Navbar';
import { InfoTooltip } from '@/components/InfoTooltip';
import { TOOLTIP_CONTENT } from '@/lib/tooltip-content';
import { Save, MapPin, Target, Bell, Zap, MessageSquare, ExternalLink, CheckCircle2, Clock } from 'lucide-react';

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        location: 'Los Angeles, CA',
        zip: '90001',
        radius: 200,
        locations: ['losangeles', 'orangecounty', 'phoenix'],
        makes: ['Toyota', 'Lexus', 'Honda', 'Subaru', 'Mazda'],
        year_min: 2019,
        year_max: 2023,
        mileage_max: 100000,
        price_min: 3000,
        price_max: 14000,
        condition_include: ['clean title', 'low miles'],
        condition_exclude: ['rebuilt', 'flood', 'salvage'],
        motivation_keywords: ['must sell', 'moving', 'cash only'],
        post_age_max: 1,
        margin_min: 1500,
        sms_numbers: ['+15551234567'],
        // New Dealership Fields
        pulse_interval: 15,
        max_items_per_city: 2,
        unicorn_threshold: 4000,
        outreach_sms_goal: 'Ask for bottom dollar',
        ai_persona: 'Professional but casual car buyer',
        crm_webhook_url: '',
        telnyx_phone_number: '+1234567890',
        batch_size: 5,
        sms_auto_enabled: true,
        sms_min_margin: 2000,
        sms_max_mileage: 120000,
        sms_year_min: 2018,
        sms_year_max: 2026,
        sms_price_min: 3000,
        sms_price_max: 14000,
        sms_require_vin: false,
        sms_exclude_keywords: ['rebuilt', 'salvage', 'parts only', 'mechanic special'],
        body_styles: ['SUV', 'Truck', 'Sedan'],
        priority_models: ['Civic', 'Camry', 'F-150', 'Accord', 'CR-V'],
        recon_multiplier: 1.0,
        active_hour_start: 7,
        active_hour_end: 22
    });

    const fetchSettings = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('settings')
            .select('*')
            .single();

        if (data) {
            setSettings({
                ...settings,
                ...data,
                locations: data.locations || settings.locations,
                condition_include: data.condition_include || settings.condition_include,
                condition_exclude: data.condition_exclude || settings.condition_exclude,
                motivation_keywords: data.motivation_keywords || settings.motivation_keywords,
            });
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        const { error } = await supabase
            .from('settings')
            .upsert({
                ...settings,
                id: '00000000-0000-0000-0000-000000000000',
                updated_at: new Date().toISOString()
            });

        if (!error) alert('Settings saved successfully!');
        else alert('Error saving settings: ' + error.message);
        setSaving(false);
    };

    const resetToOptimalDefaults = () => {
        setSettings({
            ...settings,
            makes: ['Toyota', 'Lexus', 'Honda', 'Subaru', 'Mazda'],
            year_min: 2019,
            year_max: 2023,
            mileage_max: 100000,
            price_min: 3000,
            price_max: 14000,
            locations: ['losangeles', 'orangecounty', 'phoenix'],
            condition_include: ['clean title', 'low miles'],
            condition_exclude: ['rebuilt', 'flood', 'salvage'],
            motivation_keywords: ['must sell', 'moving', 'cash only'],
            post_age_max: 1,
            margin_min: 1500,
            pulse_interval: 15,
            max_items_per_city: 2,
            unicorn_threshold: 4000,
            recon_multiplier: 1.0,
            active_hour_start: 7,
            active_hour_end: 22,
            batch_size: 5,
            sms_require_vin: false
        });
    };

    if (loading) return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center">
            <div className="animate-pulse text-indigo-500 font-black uppercase tracking-[0.2em] text-xs italic">Syncing Engine Config...</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#020617] text-slate-50 relative overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-[150px] -z-10" />
            <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-emerald-600/5 rounded-full blur-[120px] -z-10" />

            <Navbar />

            <main className="max-w-[1200px] mx-auto px-4 py-12 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-6 mb-16">
                    <div>
                        <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full text-[10px] font-black tracking-[0.2em] uppercase mb-4 animate-pulse">
                            <Target size={14} className="fill-current" />
                            ENGINE CORE V2.0
                        </div>
                        <h1 className="text-6xl font-black text-white uppercase tracking-tighter italic leading-none">
                            Control <span className="text-indigo-500">Center</span>
                        </h1>
                        <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px] mt-2 ml-1 opacity-70">Strategic Sniper Configuration • Global System Toggling</p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={resetToOptimalDefaults}
                            className="px-8 py-3 rounded-2xl font-black text-slate-500 hover:text-white transition-all uppercase tracking-[0.2em] text-[10px] glass-card"
                        >
                            Reset Logic
                        </button>
                        <button
                            onClick={fetchSettings}
                            className="px-8 py-3 rounded-2xl font-black text-indigo-400 hover:text-indigo-300 transition-all uppercase tracking-[0.2em] text-[10px] glass-card flex items-center gap-2"
                        >
                            <Clock size={14} />
                            Load Settings
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white px-10 py-4 rounded-2xl font-black flex items-center gap-3 transition-all shadow-2xl shadow-indigo-500/40 active:scale-95 uppercase tracking-[0.2em] text-[10px] border border-white/5"
                        >
                            <Save size={18} />
                            {saving ? 'Syncing...' : 'Save Settings'}
                        </button>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto space-y-16 pb-32">
                    {/* Rank 1: Makes & Models */}
                    <section className="glass-card p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-12 opacity-[0.05] group-hover:opacity-10 transition-opacity">
                            <Target size={140} className="text-indigo-500" />
                        </div>
                        <div className="flex items-center gap-5 mb-12">
                            <div className="flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-[1.25rem] text-white font-black text-2xl italic shadow-2xl shadow-indigo-500/40 transform -rotate-3 group-hover:rotate-0 transition-transform">1</div>
                            <div>
                                <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">Asset Intelligence</h2>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.25em] opacity-70">Primary Filter: Controls fast-turn inventory flow</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2 mb-2">
                                    <Zap size={12} className="text-indigo-400" /> Target Brands
                                    <InfoTooltip content={TOOLTIP_CONTENT.ASSET_BRANDS} />
                                </label>
                                <textarea
                                    value={settings.makes.join(', ')}
                                    onChange={(e) => setSettings({ ...settings, makes: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                                    className="w-full bg-slate-950/60 border border-white/5 rounded-[2rem] p-8 focus:ring-2 focus:ring-indigo-500/50 text-white font-black uppercase tracking-widest text-xs placeholder:text-slate-800 focus:bg-slate-950 transition-all leading-relaxed"
                                    rows={3}
                                    placeholder="Honda, Toyota, Lexus..."
                                />
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2 mb-2">
                                    <Target size={12} className="text-indigo-400" /> Priority Models
                                    <InfoTooltip content={TOOLTIP_CONTENT.CITY_DENSITY} />
                                </label>
                                <textarea
                                    value={(settings as any).priority_models?.join(', ') || ''}
                                    onChange={(e) => setSettings({ ...settings, priority_models: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } as any)}
                                    className="w-full bg-slate-950/60 border border-white/5 rounded-[2rem] p-8 focus:ring-2 focus:ring-indigo-500/50 text-white font-black uppercase tracking-widest text-xs placeholder:text-slate-800 focus:bg-slate-950 transition-all leading-relaxed"
                                    rows={3}
                                    placeholder="Civic, Camry, F-150..."
                                />
                            </div>
                        </div>
                    </section>

                    {/* Rank 2 & 3: Year & Mileage */}
                    <section className="glass-card p-10 rounded-[3rem] shadow-2xl group">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                            <div className="space-y-8">
                                <div className="flex items-center gap-5">
                                    <div className="flex items-center justify-center w-12 h-12 bg-slate-900 rounded-[1.25rem] text-indigo-400 font-black italic border border-white/10 group-hover:scale-110 transition-transform">2</div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">Vintage Range</h3>
                                            <InfoTooltip content={TOOLTIP_CONTENT.YEAR_THRESHOLD} />
                                        </div>
                                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] opacity-70">Reduces recon exposure</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">FROM</p>
                                        <input type="number" value={settings.year_min} onChange={e => setSettings({ ...settings, year_min: parseInt(e.target.value) })} className="w-full bg-slate-950/60 border border-white/5 rounded-2xl p-5 font-black text-center text-white focus:bg-slate-950 transition-all" />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">TO</p>
                                        <input type="number" value={settings.year_max || 2026} onChange={e => setSettings({ ...settings, year_max: parseInt(e.target.value) } as any)} className="w-full bg-slate-950/60 border border-white/5 rounded-2xl p-5 font-black text-center text-white focus:bg-slate-950 transition-all" />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-8 border-l border-white/5 pl-4 md:pl-16">
                                <div className="flex items-center gap-5">
                                    <div className="flex items-center justify-center w-12 h-12 bg-slate-900 rounded-[1.25rem] text-indigo-400 font-black italic border border-white/10 group-hover:scale-110 transition-transform">3</div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">Odometer Limit</h3>
                                            <InfoTooltip content={TOOLTIP_CONTENT.MILEAGE_CAP} />
                                        </div>
                                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] opacity-70">Preserves flip velocity</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">MAX MILES</p>
                                    <input type="number" value={settings.mileage_max} onChange={e => setSettings({ ...settings, mileage_max: parseInt(e.target.value) })} className="w-full bg-slate-950/60 border border-white/5 rounded-2xl p-5 font-black text-white focus:bg-slate-950 transition-all px-8" />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Rank 4: Price Band & AI Scoring */}
                    <section className="glass-card p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                        <div className="flex items-center justify-between mb-12">
                            <div className="flex items-center gap-5">
                                <div className="flex items-center justify-center w-14 h-14 bg-emerald-500 rounded-[1.25rem] text-white font-black text-2xl italic shadow-2xl shadow-emerald-500/40 transform -rotate-3 group-hover:rotate-0 transition-transform">4</div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">Monetary Guardrails</h2>
                                        <InfoTooltip content={TOOLTIP_CONTENT.PRICE_LIMITS} />
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.25em] opacity-70">Targets 15-25% Under-market Opportunities</p>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
                                    Capital Min ($)
                                </label>
                                <input type="number" value={settings.price_min} onChange={e => setSettings({ ...settings, price_min: parseInt(e.target.value) })} className="w-full bg-slate-950/60 border border-white/5 rounded-2xl p-6 font-black text-white text-lg focus:bg-slate-950 transition-all" />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
                                    Capital Max ($)
                                </label>
                                <input type="number" value={settings.price_max} onChange={e => setSettings({ ...settings, price_max: parseInt(e.target.value) })} className="w-full bg-slate-950/60 border border-white/5 rounded-2xl p-6 font-black text-white text-lg focus:bg-slate-950 transition-all" />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
                                    Risk Multiplier (AI)
                                    <InfoTooltip content={TOOLTIP_CONTENT.SMS_SAFEGUARDS} />
                                </label>
                                <div className="flex items-center bg-slate-950/60 border border-white/5 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/50">
                                    <input type="number" step="0.1" value={settings.recon_multiplier} onChange={e => setSettings({ ...settings, recon_multiplier: parseFloat(e.target.value) })} className="w-full bg-transparent border-none p-6 font-black text-center text-white text-lg" />
                                    <span className="pr-8 text-[10px] font-black text-slate-700 uppercase tracking-widest italic">α-factor</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Rank 5: Radar & Location */}
                    <section className="glass-card p-10 rounded-[3rem] shadow-2xl group">
                        <div className="flex items-center gap-5 mb-12">
                            <div className="flex items-center justify-center w-14 h-14 bg-indigo-500 rounded-[1.25rem] text-white font-black text-2xl italic shadow-2xl shadow-indigo-500/40 transform -rotate-3 group-hover:rotate-0 transition-transform">5</div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">Geographic Radar</h2>
                                    <InfoTooltip content={TOOLTIP_CONTENT.SEARCH_RADIUS} />
                                </div>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.25em] opacity-70">Controls global logistics and transport overhead</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="flex items-center gap-8">
                                <div className="p-5 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/10 glow-indigo">
                                    <MapPin size={28} />
                                </div>
                                <div className="flex-1 space-y-3">
                                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Home ZIP</label>
                                    <input type="text" value={settings.zip || ''} onChange={e => setSettings({ ...settings, zip: e.target.value } as any)} className="w-full bg-slate-950/60 border border-white/5 rounded-2xl p-5 font-black text-white text-lg focus:bg-slate-950 transition-all text-center tracking-widest" />
                                </div>
                                <div className="flex-1 space-y-3 font-black">
                                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">Radius (mi)</label>
                                    <input type="number" value={settings.radius || 200} onChange={e => setSettings({ ...settings, radius: parseInt(e.target.value) } as any)} className="w-full bg-slate-950/60 border border-white/5 rounded-2xl p-5 font-black text-white text-lg focus:bg-slate-950 transition-all text-center" />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Rank 6 & 7: Condition & Motivation */}
                    <section className="glass-card p-10 rounded-[3rem] shadow-2xl mb-12">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                            <div className="space-y-8">
                                <div className="flex items-center gap-5">
                                    <div className="flex items-center justify-center w-12 h-12 bg-slate-900 rounded-[1.25rem] text-indigo-400 font-black italic border border-white/10 group-hover:scale-110 transition-transform">6</div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">Linguistic Filters</h3>
                                        <InfoTooltip content={TOOLTIP_CONTENT.SMS_SAFEGUARDS} />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">BLACKLISTED TERMS (EXCLUDE)</p>
                                    <textarea
                                        value={settings.condition_exclude.join(', ')}
                                        onChange={(e) => setSettings({ ...settings, condition_exclude: e.target.value.split(',').map(s => s.trim()) })}
                                        className="w-full bg-slate-950/60 border border-white/5 rounded-[2rem] p-8 focus:ring-2 focus:ring-red-500/40 text-white font-black uppercase text-[10px] tracking-[0.15em] focus:bg-slate-950 transition-all leading-loose h-40"
                                        placeholder="rebuilt, salvaged, flood..."
                                    />
                                </div>
                            </div>
                            <div className="space-y-8 border-l border-white/5 pl-4 md:pl-16">
                                <div className="flex items-center gap-5">
                                    <div className="flex items-center justify-center w-12 h-12 bg-slate-900 rounded-[1.25rem] text-indigo-400 font-black italic border border-white/10 group-hover:scale-110 transition-transform">7</div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">Motivation Radar</h3>
                                        <InfoTooltip content={TOOLTIP_CONTENT.AI_NOTES} />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">CRITICAL SIGNALS (BOOST)</p>
                                    <textarea
                                        value={settings.motivation_keywords.join(', ')}
                                        onChange={(e) => setSettings({ ...settings, motivation_keywords: e.target.value.split(',').map(s => s.trim()) })}
                                        className="w-full bg-slate-950/60 border border-white/5 rounded-[2rem] p-8 focus:ring-2 focus:ring-emerald-500/40 text-white font-black uppercase text-[10px] tracking-[0.15em] focus:bg-slate-950 transition-all leading-loose h-40"
                                        placeholder="must sell, moving, cash only..."
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* AI Master Engine Section */}
                    <section className="glass-card p-10 rounded-[4rem] shadow-2xl relative overflow-hidden border-2 border-indigo-500/20">
                        <div className="absolute top-0 right-0 p-16 opacity-[0.05]">
                            <Zap size={180} className="text-indigo-400 animate-pulse" />
                        </div>
                        <div className="flex items-center gap-6 mb-12 relative z-10">
                            <div className="p-5 bg-indigo-600 rounded-[2rem] text-white shadow-2xl shadow-indigo-500/40">
                                <Zap size={32} className="fill-current" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">Deep-Neural Sniper</h2>
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] opacity-80 mt-1">Autonomous Outreach & Persona Logic</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 px-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Outreach Persona (Voice)</label>
                                    <InfoTooltip content={TOOLTIP_CONTENT.AI_PERSONA} />
                                </div>
                                <textarea
                                    value={settings.ai_persona || ''}
                                    onChange={(e) => setSettings({ ...settings, ai_persona: e.target.value } as any)}
                                    className="w-full bg-slate-950/80 border border-white/5 rounded-[2.5rem] p-10 focus:ring-2 focus:ring-indigo-500/50 text-white font-black text-xs tracking-widest leading-relaxed focus:bg-slate-950 transition-all"
                                    rows={5}
                                    placeholder="You are an elite private car buyer from California..."
                                />
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 px-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Primary Objective Goal</label>
                                    <InfoTooltip content={TOOLTIP_CONTENT.OUTREACH_GOAL} />
                                </div>
                                <textarea
                                    value={settings.outreach_sms_goal || ''}
                                    onChange={(e) => setSettings({ ...settings, outreach_sms_goal: e.target.value } as any)}
                                    className="w-full bg-slate-950/80 border border-white/5 rounded-[2.5rem] p-10 focus:ring-2 focus:ring-indigo-500/50 text-white font-black text-xs tracking-widest leading-relaxed focus:bg-slate-950 transition-all"
                                    rows={5}
                                    placeholder="Your goal is to secure a same-day inspection..."
                                />
                            </div>
                        </div>

                        <div className="mt-16 bg-slate-950/40 border border-white/5 rounded-[3rem] p-12 text-center group">
                            <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-8 group-hover:italic transition-all flex items-center justify-center gap-3">
                                Launch Autonomous Sniper Mode
                                <InfoTooltip content={TOOLTIP_CONTENT.AUTO_OUTREACH} />
                            </h3>
                            <div className="flex justify-center">
                                <button
                                    onClick={() => setSettings({ ...settings, sms_auto_enabled: !settings.sms_auto_enabled })}
                                    className={`relative flex items-center gap-10 px-16 py-8 rounded-[2.5rem] transition-all border-4 duration-700 ${settings.sms_auto_enabled
                                        ? 'bg-red-600 border-red-400 shadow-[0_0_80px_rgba(220,38,38,0.4)]'
                                        : 'bg-slate-900 border-slate-800'
                                        }`}
                                >
                                    <div className={`p-4 rounded-full ${settings.sms_auto_enabled ? 'bg-white text-red-600 animate-pulse' : 'bg-slate-800 text-slate-600'}`}>
                                        <Zap size={24} fill="currentColor" />
                                    </div>
                                    <span className={`text-2xl font-black uppercase tracking-tighter italic ${settings.sms_auto_enabled ? 'text-white' : 'text-slate-700'}`}>
                                        {settings.sms_auto_enabled ? 'Engine Armed & Tracking' : 'Engine Safe/Standby'}
                                    </span>
                                </button>
                            </div>
                            <p className="mt-8 text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] px-8">sniping activity monitored 24/7 • automated SMS triggers active</p>
                        </div>
                    </section>
                </div>

                {/* Fixed Action Button */}
                <div className="fixed bottom-12 right-12 z-50">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-6 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white px-12 py-7 rounded-[2.5rem] font-black uppercase tracking-[0.3em] shadow-[0_20px_60px_rgba(79,70,229,0.4)] transition-all hover:-translate-y-2 active:scale-95 text-xs italic group border border-white/10"
                    >
                        <Save size={24} className="group-hover:scale-125 transition-transform" />
                        {saving ? 'Syncing...' : 'Save Settings'}
                    </button>
                </div>
            </main>
        </div>
    );
}
