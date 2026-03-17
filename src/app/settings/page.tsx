"use client";

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Navbar } from '@/components/Navbar';
import { InfoTooltip } from '@/components/InfoTooltip';
import { ActivityLog } from '@/components/ActivityLog';
import { LeadAnalysisTable } from '@/components/LeadAnalysisTable';
import { TOOLTIP_CONTENT } from '@/lib/tooltip-content';
import { Lead } from '@/types/database';
// @ts-ignore
import { Save, MapPin, Target, Bell, Zap, MessageSquare, ExternalLink, CheckCircle2, Clock, Play, Loader2, Archive, Send, Maximize2, Minimize2, X } from 'lucide-react';

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [error, setError] = useState(null as string | null);
    const [success, setSuccess] = useState(null as string | null);

    // Lead Management State (Cloned from Dashboard)
    const [leads, setLeads] = useState([] as any[]);
    const [selectedLeads, setSelectedLeads] = useState(new Set<string>() as Set<string>);
    const [bulkUpdating, setBulkUpdating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isTableMaximized, setIsTableMaximized] = useState(false);
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
        active_hour_end: 22,
        daily_budget_usd: 1.00,
        budget_spent_today: 0.00,
        exclude_salvage: true
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
                exclude_salvage: data.exclude_salvage ?? settings.exclude_salvage, // Handle new boolean field
            });
        }
    };

    const fetchLeads = async () => {
        const { data, error } = await supabase
            .from('leads')
            .select('*')
            .order('post_time', { ascending: false });
        if (data) setLeads(data);
    };

    const handleStatusChange = async (id: string, status: Lead['status']) => {
        const { error } = await supabase.from('leads').update({ status }).eq('id', id);
        if (!error) setLeads((prev: Lead[]) => prev.map(l => l.id === id ? { ...l, status } : l));
    };

    const handleDeleteLead = async (id: string) => {
        if (!confirm('Remove this lead?')) return;
        const { error } = await supabase.from('leads').delete().eq('id', id);
        if (!error) setLeads((prev: Lead[]) => prev.filter(l => l.id !== id));
    };

    const handleAction = async (id: string, action: string) => {
        if (action === 'telegram') {
            setSuccess('Blasting to Admin...');
            setTimeout(() => setSuccess(null), 2000);
        } else if (action === 'contact') {
            // CRM Contact Logic
        }
    };

    const toggleSelect = (id: string, selected: boolean) => {
        const next = new Set(selectedLeads);
        if (selected) next.add(id);
        else next.delete(id);
        setSelectedLeads(next);
    };

    const toggleSelectAll = (selected: boolean) => {
        if (selected) setSelectedLeads(new Set(filteredLeads.map((l: Lead) => l.id)));
        else setSelectedLeads(new Set());
    };

    const handleBulkStatusChange = async (status: Lead['status'] | 'Archived') => {
        setBulkUpdating(true);
        const ids = Array.from(selectedLeads);
        const { error } = await supabase.from('leads').update({ status: status === 'Archived' ? 'Dead' : status }).in('id', ids);
        if (!error) {
            setLeads((prev: Lead[]) => prev.map(l => ids.includes(l.id) ? { ...l, status: (status === 'Archived' ? 'Dead' : status) as any } : l));
            setSelectedLeads(new Set());
            setSuccess(`Batch ${status === 'Archived' ? 'Purged' : 'Updated'}`);
            setTimeout(() => setSuccess(null), 3000);
        }
        setBulkUpdating(false);
    };

    useEffect(() => {
        Promise.all([fetchSettings(), fetchLeads()]).then(() => setLoading(false));

        const channel = supabase
            .channel('settings-leads')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, (payload: any) => {
                if (payload.eventType === 'INSERT') setLeads((prev: Lead[]) => [payload.new as Lead, ...prev]);
                else if (payload.eventType === 'UPDATE') setLeads((prev: Lead[]) => prev.map(l => l.id === payload.new.id ? (payload.new as Lead) : l));
                else if (payload.eventType === 'DELETE') setLeads((prev: Lead[]) => prev.filter(l => l.id !== payload.old.id));
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    const filteredLeads = useMemo(() => {
        return leads.filter((l: Lead) => {
            const matchesSearch = l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                l.location?.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesSearch;
        });
    }, [leads, searchQuery]);

    const handleSave = async () => {
        setSaving(true);
        const { error } = await supabase
            .from('settings')
            .upsert({
                ...settings,
                id: '00000000-0000-0000-0000-000000000000',
                updated_at: new Date().toISOString()
            });

        if (!error) {
            setSuccess('Settings saved successfully!');
            setTimeout(() => setSuccess(null), 3000);
        } else {
            setError('Error saving settings: ' + error.message);
            setTimeout(() => setError(null), 5000);
        }
        setSaving(false);
    };

    const handleScan = async () => {
        setScanning(true);
        setError(null);
        try {
            const resp = await fetch('/api/scraper/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ force: true })
            });
            const data = await resp.json();
            if (resp.ok) {
                setSuccess('Search initiated!');
                setTimeout(() => setSuccess(null), 5000);
            } else {
                setError(data.error || 'Search failed');
                setScanning(false);
                setTimeout(() => setError(null), 5000);
            }
        } catch (err) {
            setError('Search failed to connect');
            setScanning(false);
            setTimeout(() => setError(null), 5000);
        }
    };

    const handleStopScan = async () => {
        try {
            const resp = await fetch('/api/scraper/stop', { method: 'POST' });
            if (resp.ok) {
                setScanning(false);
                setSuccess('Search stopped.');
                setTimeout(() => setSuccess(null), 3000);
            } else {
                setError('Failed to stop search');
                setTimeout(() => setError(null), 5000);
            }
        } catch (err) {
            setError('Failed to stop search');
            setTimeout(() => setError(null), 5000);
        }
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
            sms_require_vin: false,
            daily_budget_usd: 1.00,
            exclude_salvage: true
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
                    <div className="flex flex-wrap items-center gap-4">
                        <button
                            onClick={resetToOptimalDefaults}
                            className="px-6 py-2.5 rounded-xl font-black text-slate-600 hover:text-slate-400 transition-all uppercase tracking-[0.2em] text-[9px] border border-white/5 bg-white/5 hover:bg-white/10"
                        >
                            Reset Logic
                        </button>
                        <button
                            onClick={fetchSettings}
                            className="px-6 py-2.5 rounded-xl font-black text-slate-600 hover:text-slate-400 transition-all uppercase tracking-[0.2em] text-[9px] border border-white/5 bg-white/5 hover:bg-white/10 flex items-center gap-2"
                        >
                            <Clock size={12} />
                            Load Config
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-6 py-2.5 rounded-xl font-black text-slate-600 hover:text-slate-400 transition-all uppercase tracking-[0.2em] text-[9px] border border-white/5 bg-white/5 hover:bg-white/10 flex items-center gap-2"
                        >
                            <Save size={12} />
                            {saving ? 'Syncing...' : 'Save Changes'}
                        </button>

                        <div className="h-8 w-px bg-white/10 mx-2" />

                        {scanning ? (
                            <button
                                onClick={handleStopScan}
                                className="bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white px-10 py-4 rounded-2xl font-black flex items-center gap-3 transition-all shadow-[0_0_40px_rgba(220,38,38,0.2)] active:scale-95 uppercase tracking-[0.2em] text-[10px] border border-red-500/30 group"
                            >
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-ping group-hover:bg-white" />
                                Stop Sniper Scan
                            </button>
                        ) : (
                            <button
                                onClick={handleScan}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-4 rounded-2xl font-black flex items-center gap-3 transition-all shadow-[0_0_60px_rgba(79,70,229,0.4)] active:scale-95 uppercase tracking-[0.2em] text-[10px] border border-white/10 glow-indigo"
                            >
                                <Play size={18} className="fill-current" />
                                Start Sniper Scan
                            </button>
                        )}
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
                                <div className="space-y-2 pt-4 border-t border-white/5">
                                    <div className="flex items-center gap-2">
                                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">MAX POST AGE (HOURS)</p>
                                        <InfoTooltip content="Only scrape listings newer than this many hours." />
                                    </div>
                                    <input type="number" value={settings.post_age_max || 24} onChange={e => setSettings({ ...settings, post_age_max: parseInt(e.target.value) })} className="w-full bg-slate-950/60 border border-white/5 rounded-2xl p-5 font-black text-white focus:bg-slate-950 transition-all px-8" />
                                </div>
                                <div className="flex items-center justify-between p-5 bg-slate-950/40 border border-white/5 rounded-2xl group/toggle cursor-pointer hover:bg-slate-950/60 transition-all mt-4" onClick={() => setSettings({ ...settings, exclude_salvage: !settings.exclude_salvage })}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${settings.exclude_salvage ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-500'}`}>
                                            <Zap size={16} className={settings.exclude_salvage ? 'fill-indigo-400' : ''} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-white uppercase tracking-widest italic leading-none">Exclude Salvage</p>
                                            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider mt-1 opacity-60">Filtered At Source</p>
                                        </div>
                                    </div>
                                    <div className={`w-12 h-6 rounded-full p-1 transition-all ${settings.exclude_salvage ? 'bg-indigo-500' : 'bg-slate-800'}`}>
                                        <div className={`w-4 h-4 rounded-full bg-white shadow-lg transition-transform ${settings.exclude_salvage ? 'translate-x-6' : 'translate-x-0'}`} />
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

                    {/* Rank 6: System Resource Guardrails */}
                    <section className="glass-card p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group border-2 border-emerald-500/20">
                        <div className="flex items-center gap-5 mb-12">
                            <div className="flex items-center justify-center w-14 h-14 bg-emerald-600 rounded-[1.25rem] text-white font-black text-2xl italic shadow-2xl shadow-emerald-500/40 transform -rotate-3 group-hover:rotate-0 transition-transform">6</div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">Budget Guardrail</h2>
                                    <InfoTooltip content="Hard limits to prevent Apify overspending. Resets daily at midnight." />
                                </div>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.25em] opacity-70">Protects your recurring balance</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2 mb-2">
                                    Daily Max Budget ($USD)
                                </label>
                                <div className="flex items-center bg-slate-950/60 border border-white/5 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500/50">
                                    <span className="pl-6 text-emerald-500 font-black text-lg">$</span>
                                    <input 
                                        type="number" 
                                        step="0.01" 
                                        value={settings.daily_budget_usd} 
                                        onChange={e => setSettings({ ...settings, daily_budget_usd: parseFloat(e.target.value) })} 
                                        className="w-full bg-transparent border-none p-6 font-black text-white text-lg" 
                                    />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2 mb-2 text-indigo-400">
                                    Spent Today (Live Tracking)
                                </label>
                                <div className="bg-slate-950/60 border border-white/5 rounded-2xl p-6 flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <p className="text-2xl font-black text-white italic leading-none">${settings.budget_spent_today?.toFixed(4)}</p>
                                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em] mt-2 italic">Updated after each pulse</p>
                                    </div>
                                    <div className="w-12 h-12 rounded-full border-2 border-slate-900 border-t-emerald-500 animate-spin" />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Rank 7 & 8: Condition & Motivation */}
                    <section className="glass-card p-10 rounded-[3rem] shadow-2xl mb-12">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                            <div className="space-y-8">
                                <div className="flex items-center gap-5">
                                    <div className="flex items-center justify-center w-12 h-12 bg-slate-900 rounded-[1.25rem] text-indigo-400 font-black italic border border-white/10 group-hover:scale-110 transition-transform">7</div>
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
                                    <div className="flex items-center justify-center w-12 h-12 bg-slate-900 rounded-[1.25rem] text-indigo-400 font-black italic border border-white/10 group-hover:scale-110 transition-transform">8</div>
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
                    {/* Lead Activity Log */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 px-6">
                            <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">Engine Activity Log</h3>
                            <div className="h-px flex-1 bg-white/5" />
                        </div>
                        <ActivityLog />
                    </div>

                    {/* Tactical Listing Section (Cloned) */}
                    <div className={`pt-16 border-t border-white/5 space-y-8 ${isTableMaximized ? 'fixed inset-0 z-[100] bg-[#020617] p-8 overflow-hidden flex flex-col' : ''}`}>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
                            <div className="flex items-center gap-4">
                                <h2 className={`font-black text-white uppercase tracking-tighter italic leading-none ${isTableMaximized ? 'text-4xl' : 'text-3xl'}`}>Tactical Listing</h2>
                                <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black px-4 py-1 rounded-full tracking-widest uppercase italic">
                                    {filteredLeads.length} Nodes Online
                                </span>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-3 bg-slate-950/60 rounded-2xl border border-white/5 p-1 px-4 shadow-2xl">
                                    <Target size={14} className="text-indigo-500" />
                                    <input
                                        type="text"
                                        placeholder="SEARCH TACTICAL DATA..."
                                        className="bg-transparent border-none py-2 text-[9px] font-black uppercase tracking-widest focus:ring-0 w-48 placeholder:text-slate-700 text-white"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <button
                                    onClick={() => setIsTableMaximized(!isTableMaximized)}
                                    className="p-3 bg-slate-900 shadow-2xl border border-white/5 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-2 group"
                                    title={isTableMaximized ? "Exit Fullscreen" : "Maximize Table"}
                                >
                                    {isTableMaximized ? (
                                        <>
                                            <Minimize2 size={20} />
                                            <span className="text-[10px] font-black uppercase tracking-widest hidden group-hover:inline">Minimize</span>
                                        </>
                                    ) : (
                                        <>
                                            <Maximize2 size={20} />
                                            <span className="text-[10px] font-black uppercase tracking-widest hidden group-hover:inline">Maximize</span>
                                        </>
                                    )}
                                </button>
                                {isTableMaximized && (
                                    <button
                                        onClick={() => setIsTableMaximized(false)}
                                        className="p-3 bg-red-600/10 text-red-500 shadow-2xl border border-red-500/10 rounded-2xl hover:bg-red-600 hover:text-white transition-all active:scale-95"
                                    >
                                        <X size={20} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <LeadAnalysisTable
                            leads={filteredLeads}
                            onStatusChange={handleStatusChange}
                            onDelete={handleDeleteLead}
                            onAction={handleAction}
                            selectedLeads={selectedLeads}
                            onSelect={toggleSelect}
                            onSelectAll={toggleSelectAll}
                            maximized={isTableMaximized}
                        />
                    </div>
                </div>

                {selectedLeads.size > 0 && (
                    <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[60] glass-card bg-[#020617]/95 text-white px-8 py-5 rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.9)] flex items-center gap-8 border border-white/10 ring-1 ring-indigo-500/30 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-8 duration-500">
                        <div className="flex flex-col">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] italic leading-none">{selectedLeads.size} Targets</p>
                            <p className="text-[7px] font-black text-indigo-400 uppercase tracking-widest mt-1 opacity-60 italic">Locked in Batch</p>
                        </div>
                        <div className="h-8 w-px bg-white/10"></div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => handleBulkStatusChange('Contacted')}
                                disabled={bulkUpdating}
                                className="text-[9px] font-black uppercase tracking-widest bg-indigo-600 text-white px-6 py-3 rounded-2xl hover:bg-indigo-500 transition-all flex items-center gap-2 shadow-xl shadow-indigo-500/20 active:scale-95 border border-indigo-400/20 italic disabled:opacity-50"
                            >
                                <MessageSquare size={14} />
                                Intercept
                            </button>
                            <button
                                onClick={() => handleBulkStatusChange('Archived')}
                                disabled={bulkUpdating}
                                className="text-[9px] font-black uppercase tracking-widest bg-slate-900 text-slate-400 px-6 py-3 rounded-2xl hover:bg-slate-800 hover:text-white transition-all flex items-center gap-2 border border-white/5 active:scale-95 italic disabled:opacity-50"
                            >
                                <Archive size={14} />
                                Purge
                            </button>
                        </div>
                        <button
                            onClick={() => setSelectedLeads(new Set())}
                            className="text-[9px] font-black uppercase tracking-widest text-slate-600 hover:text-white transition-all italic underline underline-offset-4"
                        >
                            Abort
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}
