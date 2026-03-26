"use client";

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Navbar } from '@/components/Navbar';
import { InfoTooltip } from '@/components/InfoTooltip';
import { ActivityLog } from '@/components/ActivityLog';
import { LeadAnalysisTable } from '@/components/LeadAnalysisTable';
import { TOOLTIP_CONTENT } from '@/lib/tooltip-content';
import { Lead, Settings, SavedConfig } from '@/types/database';
// @ts-ignore
import { Save, MapPin, Target, Bell, Zap, MessageSquare, ExternalLink, CheckCircle2, Clock, Play, Loader2, Archive, Send, Maximize2, Minimize2, X, Sliders, Timer, Download, Trash2, Plus, RotateCcw, Search, ChevronRight, Check, Filter, Settings as SettingsIcon } from 'lucide-react';
import { LeadFilters, DealershipFilters } from '@/components/LeadFilters';

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [engineStatus, setEngineStatus] = useState('Checking' as 'Checking' | 'Online' | 'Offline' | 'Stalled');
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    // Config Management State
    const [savedConfigs, setSavedConfigs] = useState<SavedConfig[]>([]);
    const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [newConfigName, setNewConfigName] = useState('');

    // Lead Management State (Cloned from Dashboard)
    const [leads, setLeads] = useState([] as any[]);
    const [selectedLeads, setSelectedLeads] = useState(new Set<string>());
    const [bulkUpdating, setBulkUpdating] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const [isTableMaximized, setIsTableMaximized] = useState(false);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [filters, setFilters] = useState({
        search: '',
        city: '',
        minYear: '',
        maxYear: '',
        minPrice: '',
        maxPrice: '',
        maxMileage: '',
        minMargin: '',
        status: '',
        titleStatus: '',
        maxDaysOld: '',
    });
    
    const [settings, setSettings] = useState({
        id: '00000000-0000-0000-0000-000000000000',
        location: 'Los Angeles, CA',
        zip: '90001',
        radius: 200,
        locations: ['losangeles', 'orangecounty', 'phoenix'],
        makes: ['Toyota', 'Lexus', 'Honda', 'Subaru', 'Mazda'],
        models: [],
        keywords: [],
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
        pulse_interval: 15,
        max_items_per_city: 25,
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
        exclude_salvage: true,
        auto_scan_enabled: true,
        consecutive_empty_runs: 0
    } as any);

    const fetchSettings = async () => {
        setLoading(true);
        const { data } = await supabase
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
                exclude_salvage: data.exclude_salvage ?? settings.exclude_salvage, 
                auto_scan_enabled: data.auto_scan_enabled ?? settings.auto_scan_enabled, 
            });
        }
    };

    const fetchSavedConfigs = async () => {
        const { data } = await supabase
            .from('saved_configs')
            .select('*')
            .order('created_at', { ascending: false });
        if (data) setSavedConfigs(data);
    };

    const handleSaveAsNew = async () => {
        if (!newConfigName.trim()) return;
        setSaving(true);
        const { error } = await supabase
            .from('saved_configs')
            .insert({
                name: newConfigName,
                config: settings,
                dealer_id: '00000000-0000-0000-0000-000000000000'
            });

        if (!error) {
            setSuccess(`Config "${newConfigName}" saved!`);
            setNewConfigName('');
            setIsSaveModalOpen(false);
            fetchSavedConfigs();
            setTimeout(() => setSuccess(null), 3000);
        } else {
            setError('Error saving config: ' + error.message);
        }
        setSaving(false);
    };

    const handleLoadConfig = (config: Partial<Settings>) => {
        setSettings({ ...settings, ...config });
        setIsLoadModalOpen(false);
        setSuccess('Configuration loaded!');
        setTimeout(() => setSuccess(null), 3000);
    };

    const handleDeleteConfig = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm('Delete this saved configuration?')) return;
        const { error } = await supabase.from('saved_configs').delete().eq('id', id);
        if (!error) {
            setSavedConfigs((prev: SavedConfig[]) => prev.filter((c: SavedConfig) => c.id !== id));
        }
    };

    const fetchLeads = async () => {
        const { data, error } = await supabase
            .from('leads')
            .select('*')
            .order('post_time', { ascending: false });
        if (data) {
            setLeads(data);
            setLastUpdated(new Date());
        }
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
        Promise.all([fetchSettings(), fetchLeads(), fetchSavedConfigs()]).then(() => setLoading(false));

        const channel = supabase
            .channel('settings-leads')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, (payload: any) => {
                if (payload.eventType === 'INSERT') {
                    setLeads((prev: Lead[]) => [payload.new as Lead, ...prev]);
                    setLastUpdated(new Date());
                }
                else if (payload.eventType === 'UPDATE') setLeads((prev: Lead[]) => prev.map(l => l.id === payload.new.id ? (payload.new as Lead) : l));
                else if (payload.eventType === 'DELETE') setLeads((prev: Lead[]) => prev.filter(l => l.id !== payload.old.id));
            })
            .subscribe();

        const checkEngine = async () => {
            try {
                // Heartbeat to Lambda (using a no-op payload if possible, or just a ping)
                // Since this is a restricted request, we just check if the URL responds
                const start = Date.now();
                const controller = new AbortController();
                const id = setTimeout(() => controller.abort(), 8000);
                
                const res = await fetch('/api/scraper/check', { signal: controller.signal });
                clearTimeout(id);
                
                if (res.ok) {
                    setEngineStatus('Online');
                } else {
                    setEngineStatus('Offline');
                }
            } catch (err) {
                setEngineStatus('Offline');
            }
        };

        checkEngine();
        const heartbeatInterval = setInterval(checkEngine, 60000); // Pulse every minute

        return () => { 
            supabase.removeChannel(channel); 
            clearInterval(heartbeatInterval);
        };
    }, []);

    const availableCities = useMemo(() => {
        const cities = leads.map((l: Lead) => l.city).filter(Boolean);
        return Array.from(new Set(cities)) as string[];
    }, [leads]);

    const filteredLeads = useMemo(() => {
        return leads.filter((l: Lead) => {
            // Text Search
            const matchesSearch = !filters.search || 
                l.title.toLowerCase().includes(filters.search.toLowerCase()) ||
                l.location?.toLowerCase().includes(filters.search.toLowerCase()) ||
                l.city?.toLowerCase().includes(filters.search.toLowerCase()) ||
                l.ai_notes?.toLowerCase().includes(filters.search.toLowerCase());

            // City Filter
            const matchesCity = !filters.city || l.city === filters.city;

            // Year Filter
            const year = l.year ? parseInt(l.year as any) : parseInt(l.title.match(/\b(19|20)\d{2}\b/)?.[0] || '0');
            const matchesMinYear = !filters.minYear || (year >= parseInt(filters.minYear));
            const matchesMaxYear = !filters.maxYear || (year > 0 && year <= parseInt(filters.maxYear));

            // Price Filter
            const price = l.price;
            const matchesMinPrice = !filters.minPrice || (price !== null && price >= parseInt(filters.minPrice));
            const matchesMaxPrice = !filters.maxPrice || (price !== null && price <= parseInt(filters.maxPrice));

            // Mileage Filter
            const mileage = l.mileage;
            const matchesMileage = !filters.maxMileage || (mileage !== null && mileage <= parseInt(filters.maxMileage));

            // Margin Filter
            const margin = l.ai_margin;
            const matchesMargin = !filters.minMargin || (margin !== null && margin >= parseInt(filters.minMargin));

            // Status Filter
            const matchesStatus = !filters.status || l.status === filters.status;

            // Title Status Filter
            const matchesTitle = !filters.titleStatus || 
                (filters.titleStatus === 'Clean' ? l.is_clean_title : !l.is_clean_title);

            // Age Filter (Days Old)
            const postDate = l.post_time ? new Date(l.post_time) : null;
            const diffDays = postDate ? (new Date().getTime() - postDate.getTime()) / (1000 * 60 * 60 * 24) : 999;
            const matchesAge = !filters.maxDaysOld || (diffDays <= parseInt(filters.maxDaysOld));

            return matchesSearch && matchesCity && matchesMinYear && matchesMaxYear && 
                   matchesMinPrice && matchesMaxPrice && matchesMileage && matchesMargin && 
                   matchesStatus && matchesTitle && matchesAge;
        });
    }, [leads, filters]);

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
            max_items_per_city: 25,
            unicorn_threshold: 4000,
            recon_multiplier: 1.0,
            active_hour_start: 7,
            active_hour_end: 22,
            batch_size: 5,
            sms_require_vin: false,
            daily_budget_usd: 1.00,
            exclude_salvage: true,
            auto_scan_enabled: true
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
                <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 mb-10">
                    <div>
                        <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full text-xs font-black tracking-[0.2em] uppercase mb-4 animate-pulse">
                            <Target size={14} className="fill-current" />
                            ENGINE CORE V2.0
                        </div>
                        <h1 className="text-6xl font-bold text-white uppercase tracking-tighter leading-none">
                            Control <span className="text-indigo-500">Center</span>
                        </h1>
                        {/* Control Center Panel */}
                        <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs mt-2 ml-1 opacity-70">Strategic Sniper Configuration • Global System Toggling</p>
                        
                        {/* Scan Controls Panel */}
                        <div className="mt-6 flex flex-wrap items-center gap-4">
                            <div className="inline-flex items-center gap-4 bg-slate-900/80 border border-emerald-500/20 rounded-[2rem] p-2 pr-6 shadow-xl relative overflow-hidden">
                                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                                    <Timer size={20} className="text-emerald-400" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-semibold uppercase tracking-widest text-xs text-white">
                                        30-Min Auto Scan
                                    </span>
                                    <span className="font-bold uppercase tracking-[0.2em] text-[10px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                                        <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${engineStatus === 'Online' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                        {engineStatus === 'Online' ? 'ACTIVE' : 'STANDBY — Engine Offline'}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setSettings({ ...settings, auto_scan_enabled: !settings.auto_scan_enabled })}
                                    className={`ml-6 flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold uppercase tracking-widest text-xs transition-all transform active:scale-95 ${
                                        settings.auto_scan_enabled 
                                            ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.3)]' 
                                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500/30'
                                    }`}
                                >
                                    {settings.auto_scan_enabled ? (
                                        <>
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-400 shadow-[0_0_5px_rgba(248,113,113,0.8)] animate-pulse" />
                                            STOP
                                        </>
                                    ) : (
                                        <>
                                            <Play size={10} className="fill-current" />
                                            ACTIVATE
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Manual Scan Button */}
                            {scanning ? (
                                <button
                                    onClick={handleStopScan}
                                    className="bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white px-8 py-4 rounded-[2rem] font-black flex items-center gap-3 transition-all shadow-[0_0_20px_rgba(220,38,38,0.2)] active:scale-95 uppercase tracking-[0.2em] text-xs border border-red-500/30 group"
                                >
                                    <div className="w-2 h-2 bg-red-500 rounded-full animate-ping group-hover:bg-white" />
                                    Stop Manual Scan
                                </button>
                            ) : (
                                <button
                                    onClick={handleScan}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-[2rem] font-bold flex items-center gap-3 transition-all shadow-xl shadow-indigo-500/20 active:scale-95 uppercase tracking-[0.2em] text-xs border border-indigo-400/20"
                                    title="Forces an immediate scan for new listings"
                                >
                                    <Play size={14} className="fill-current" />
                                    Manual Scan
                                </button>
                            )}

                            <div className="h-10 w-px bg-white/5 mx-2 hidden md:block" />

                            <button
                                onClick={() => setIsLoadModalOpen(true)}
                                className="bg-slate-900 border border-white/10 hover:border-indigo-500/30 text-slate-300 hover:text-white px-6 py-4 rounded-[2rem] font-bold flex items-center gap-2 transition-all active:scale-95 uppercase tracking-[0.2em] text-[10px]"
                            >
                                <Download size={14} />
                                Load Config
                            </button>

                            <button
                                onClick={() => setIsSaveModalOpen(true)}
                                className="bg-slate-900 border border-white/10 hover:border-emerald-500/30 text-slate-300 hover:text-white px-6 py-4 rounded-[2rem] font-bold flex items-center gap-2 transition-all active:scale-95 uppercase tracking-[0.2em] text-[10px]"
                            >
                                <Save size={14} />
                                Save Template
                            </button>
                        </div>
                    </div>
                </div>

                <div className="max-w-6xl mx-auto space-y-8 pb-32">
                    {/* Rank 1: Makes & Models */}
                    <section className="glass-card p-6 rounded-3xl shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.05] group-hover:opacity-10 transition-opacity">
                            <Target size={100} className="text-indigo-500" />
                        </div>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="flex items-center justify-center w-10 h-10 bg-indigo-600 rounded-xl text-white font-bold text-xl italic shadow-lg shadow-indigo-500/40 transform -rotate-3 group-hover:rotate-0 transition-transform">1</div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h2 className="text-xl md:text-2xl font-bold text-white uppercase tracking-tighter">Tactical Listing</h2>
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping" />
                                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest italic">
                                            Live Intel: {lastUpdated.toLocaleTimeString()}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em] opacity-70">Primary Filter: Controls fast-turn inventory flow</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2 mb-1">
                                    <Zap size={10} className="text-indigo-400" /> Target Brands
                                    <InfoTooltip content={TOOLTIP_CONTENT.ASSET_BRANDS} />
                                </label>
                                <textarea
                                    value={settings.makes.join(', ')}
                                    onChange={(e) => setSettings({ ...settings, makes: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                                    className="w-full bg-slate-950/60 border border-white/5 rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500/50 text-white font-medium uppercase tracking-widest text-xs placeholder:text-slate-800 focus:bg-slate-950 transition-all leading-snug"
                                    rows={3}
                                    placeholder="Honda, Toyota, Lexus..."
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2 mb-1">
                                    <Target size={10} className="text-indigo-400" /> Priority Models
                                    <InfoTooltip content={TOOLTIP_CONTENT.CITY_DENSITY} />
                                </label>
                                <textarea
                                    value={(settings as any).priority_models?.join(', ') || ''}
                                    onChange={(e) => setSettings({ ...settings, priority_models: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } as any)}
                                    className="w-full bg-slate-950/60 border border-white/5 rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500/50 text-white font-medium uppercase tracking-widest text-xs placeholder:text-slate-800 focus:bg-slate-950 transition-all leading-snug"
                                    rows={3}
                                    placeholder="Civic, Camry, F-150..."
                                />
                            </div>
                        </div>
                    </section>

                    {/* Rank 2 & 3: Year & Mileage */}
                    <section className="glass-card p-6 rounded-3xl shadow-xl group">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center justify-center w-10 h-10 bg-slate-900 rounded-xl text-indigo-400 font-bold italic border border-white/10 group-hover:scale-110 transition-transform">2</div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-xl font-bold text-white uppercase tracking-tighter">Vintage Range</h3>
                                            <InfoTooltip content={TOOLTIP_CONTENT.YEAR_THRESHOLD} />
                                        </div>
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.2em] opacity-70">Reduces recon exposure</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em]">FROM</p>
                                        <input type="number" value={settings.year_min} onChange={e => setSettings({ ...settings, year_min: parseInt(e.target.value) })} className="w-full bg-slate-950/60 border border-white/5 rounded-xl p-3 md:p-4 font-black text-center text-white text-sm focus:bg-slate-950 transition-all" />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em]">TO</p>
                                        <input type="number" value={settings.year_max || 2026} onChange={e => setSettings({ ...settings, year_max: parseInt(e.target.value) } as any)} className="w-full bg-slate-950/60 border border-white/5 rounded-xl p-3 md:p-4 font-black text-center text-white text-sm focus:bg-slate-950 transition-all" />
                                    </div>
                                </div>
                                <div className="space-y-2 pt-4 border-t border-white/5">
                                    <div className="flex items-center gap-2">
                                        <p className="text-[8px] font-bold text-slate-600 uppercase tracking-[0.2em]">MAX POST AGE (HOURS)</p>
                                        <InfoTooltip content="Only scrape listings newer than this many hours." />
                                    </div>
                                    <input type="number" value={settings.post_age_max || 24} onChange={e => setSettings({ ...settings, post_age_max: parseInt(e.target.value) })} className="w-full bg-slate-950/60 border border-white/5 rounded-xl p-3 md:p-4 font-bold text-white text-sm focus:bg-slate-950 transition-all px-6" />
                                </div>
                                <div className="flex items-center justify-between p-4 bg-slate-950/40 border border-white/5 rounded-xl group/toggle cursor-pointer hover:bg-slate-950/60 transition-all mt-4" onClick={() => setSettings({ ...settings, exclude_salvage: !settings.exclude_salvage })}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${settings.exclude_salvage ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-500'}`}>
                                            <Zap size={14} className={settings.exclude_salvage ? 'fill-indigo-400' : ''} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-white uppercase tracking-widest leading-none">Exclude Salvage</p>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1 opacity-60">Filtered At Source</p>
                                        </div>
                                    </div>
                                    <div className={`w-10 h-5 rounded-full p-1 transition-all ${settings.exclude_salvage ? 'bg-indigo-500' : 'bg-slate-800'}`}>
                                        <div className={`w-3 h-3 rounded-full bg-white shadow-lg transition-transform ${settings.exclude_salvage ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6 border-l border-white/5 pl-4 md:pl-8">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center justify-center w-10 h-10 bg-slate-900 rounded-xl text-indigo-400 font-bold italic border border-white/10 group-hover:scale-110 transition-transform">3</div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-xl font-bold text-white uppercase tracking-tighter">Odometer Limit</h3>
                                            <InfoTooltip content={TOOLTIP_CONTENT.MILEAGE_CAP} />
                                        </div>
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.2em] opacity-70">Preserves flip velocity</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em]">MAX MILES</p>
                                    <input type="number" value={settings.mileage_max} onChange={e => setSettings({ ...settings, mileage_max: parseInt(e.target.value) })} className="w-full bg-slate-950/60 border border-white/5 rounded-xl p-3 md:p-4 font-black text-white text-sm focus:bg-slate-950 transition-all px-6" />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Rank 4: Listings Per Session */}
                    <section className="glass-card p-6 md:p-8 rounded-3xl shadow-xl group border border-white/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-12 opacity-[0.05] group-hover:opacity-10 transition-opacity">
                            <Zap size={140} className="text-indigo-500" />
                        </div>
                        <div className="flex items-center gap-5 mb-8">
                            <div className="flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-[1.25rem] text-white font-bold text-2xl italic shadow-2xl shadow-indigo-500/40 transform -rotate-3 group-hover:rotate-0 transition-transform">4</div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-2xl font-bold text-white uppercase tracking-tighter">Control Speed</h2>
                                    <InfoTooltip content="Scraped leads per 30-min session. Higher = More results/More cost." />
                                </div>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.25em] opacity-70">Listings Per Session: Calibrates ingestion velocity</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-10">
                            <div className="flex-1 space-y-4">
                                <p className="text-xs text-slate-500 font-semibold uppercase tracking-[0.2em] leading-relaxed">
                                    Adjust the number of car listings scraped during each automated 30-minute pulse. Higher values increase the probability of finding gems but consume more budget.
                                </p>
                                <div className="flex items-center gap-4 bg-indigo-500/5 p-4 rounded-2xl border border-indigo-500/10">
                                    <Timer size={16} className="text-indigo-400" />
                                    <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest">30-Minute Cycle Enabled</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] block text-center">TOTAL LISTINGS</label>
                                    <div className="relative group">
                                        <input
                                            type="number"
                                            min={5}
                                            max={500}
                                            value={(!settings.max_items_per_city || isNaN(settings.max_items_per_city)) ? 25 : settings.max_items_per_city}
                                            onChange={e => {
                                                const parsed = parseInt(e.target.value);
                                                setSettings({ ...settings, max_items_per_city: isNaN(parsed) ? 25 : parsed } as any);
                                            }}
                                            className="w-full bg-slate-950/80 border border-white/10 rounded-3xl p-8 font-black text-white text-center text-4xl focus:ring-4 focus:ring-indigo-500/30 focus:bg-slate-950 transition-all shadow-2xl"
                                        />
                                        <div className="absolute -bottom-10 left-0 right-0 text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                            <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Total listings across all cities per run</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] block text-center">CITIES PER PULSE</label>
                                    <div className="relative group">
                                        <input
                                            type="number"
                                            min={1}
                                            max={20}
                                            value={(!settings.batch_size || isNaN(settings.batch_size)) ? 5 : settings.batch_size}
                                            onChange={e => {
                                                const parsed = parseInt(e.target.value);
                                                setSettings({ ...settings, batch_size: isNaN(parsed) ? 5 : parsed } as any);
                                            }}
                                            className="w-full bg-slate-950/80 border border-white/10 rounded-3xl p-8 font-black text-white text-center text-4xl focus:ring-4 focus:ring-indigo-500/30 focus:bg-slate-950 transition-all shadow-2xl"
                                        />
                                        <div className="absolute -bottom-10 left-0 right-0 text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                            <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">How many cities to scan in one pulse</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] block text-center">PULSE COOLDOWN (MIN)</label>
                                    <div className="relative group">
                                        <input
                                            type="number"
                                            min={1}
                                            max={300}
                                            value={(!settings.pulse_interval || isNaN(settings.pulse_interval)) ? 15 : settings.pulse_interval}
                                            onChange={e => {
                                                const parsed = parseInt(e.target.value);
                                                setSettings({ ...settings, pulse_interval: isNaN(parsed) ? 15 : parsed } as any);
                                            }}
                                            className="w-full bg-slate-950/80 border border-white/10 rounded-3xl p-8 font-black text-white text-center text-4xl focus:ring-4 focus:ring-indigo-500/30 focus:bg-slate-950 transition-all shadow-2xl"
                                        />
                                        <div className="absolute -bottom-10 left-0 right-0 text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                            <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Minutes between automated scans</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Rank 5: Radar & Location */}
                    <section className="glass-card p-6 md:p-8 rounded-3xl shadow-xl group">
                        <div className="flex items-center gap-5 mb-8">
                            <div className="flex items-center justify-center w-14 h-14 bg-indigo-500 rounded-[1.25rem] text-white font-bold text-2xl italic shadow-2xl shadow-indigo-500/40 transform -rotate-3 group-hover:rotate-0 transition-transform">5</div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-2xl font-bold text-white uppercase tracking-tighter">Geographic Radar</h2>
                                    <InfoTooltip content={TOOLTIP_CONTENT.SEARCH_RADIUS} />
                                </div>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.25em] opacity-70">Controls global logistics and transport overhead</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="flex items-center gap-6">
                                <div className="p-4 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/10 glow-indigo">
                                    <MapPin size={24} />
                                </div>
                                <div className="flex-1 space-y-3">
                                    <label className="text-xs font-black text-slate-600 uppercase tracking-[0.4em]">Home ZIP</label>
                                    <input type="text" value={settings.zip || ''} onChange={e => setSettings({ ...settings, zip: e.target.value } as any)} className="w-full bg-slate-950/60 border border-white/5 rounded-2xl p-4 font-black text-white text-lg focus:bg-slate-950 transition-all text-center tracking-widest" />
                                </div>
                                <div className="flex-1 space-y-3 font-black">
                                    <div className="flex items-center justify-center w-10 h-10 bg-slate-900 rounded-[1rem] text-indigo-400 font-black italic border border-white/10 group-hover:scale-110 transition-transform">6</div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-black text-white uppercase tracking-tighter italic">Linguistic Filters</h3>
                                        <InfoTooltip content={TOOLTIP_CONTENT.SMS_SAFEGUARDS} />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <p className="text-xs font-bold text-slate-600 uppercase tracking-[0.3em]">BLACKLISTED TERMS (EXCLUDE)</p>
                                    <textarea
                                        value={settings.condition_exclude.join(', ')}
                                        onChange={(e) => setSettings({ ...settings, condition_exclude: e.target.value.split(',').map(s => s.trim()) })}
                                        className="w-full bg-slate-950/60 border border-white/5 rounded-2xl p-4 focus:ring-2 focus:ring-red-500/40 text-white font-medium uppercase text-xs tracking-[0.15em] focus:bg-slate-950 transition-all leading-loose h-32"
                                        placeholder="rebuilt, salvaged, flood..."
                                    />
                                </div>
                            </div>
                            <div className="space-y-6 border-l border-white/5 pl-4 md:pl-10">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center justify-center w-10 h-10 bg-slate-900 rounded-[1rem] text-indigo-400 font-black italic border border-white/10 group-hover:scale-110 transition-transform">7</div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-black text-white uppercase tracking-tighter italic">Motivation Radar</h3>
                                        <InfoTooltip content={TOOLTIP_CONTENT.AI_NOTES} />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <p className="text-xs font-bold text-slate-600 uppercase tracking-[0.3em]">CRITICAL SIGNALS (BOOST)</p>
                                    <textarea
                                        value={settings.motivation_keywords.join(', ')}
                                        onChange={(e) => setSettings({ ...settings, motivation_keywords: e.target.value.split(',').map(s => s.trim()) })}
                                        className="w-full bg-slate-950/60 border border-white/5 rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500/40 text-white font-medium uppercase text-xs tracking-[0.15em] focus:bg-slate-950 transition-all leading-loose h-32"
                                        placeholder="must sell, moving, cash only..."
                                    />
                                </div>
                            </div>
                        </div>
                    </section>
                    {/* Lead Activity Log */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between px-6">
                            <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">Engine Activity Log</h3>
                            <div className="flex items-center gap-4">
                                {/* Moved to header */}
                            </div>
                        </div>
                        <div className="h-px w-full bg-white/5 mt-2 mb-6" />
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
                                <button
                                    onClick={() => setIsFilterModalOpen(true)}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                        isFilterModalOpen 
                                            ? 'bg-indigo-500 text-white shadow-[0_0_30px_rgba(99,102,241,0.4)]' 
                                            : 'bg-slate-950/60 text-slate-400 border border-white/5 hover:border-indigo-500/30'
                                    }`}
                                >
                                    <Sliders size={14} />
                                    Filter Data
                                </button>
                                <div className="h-8 w-px bg-white/5 mx-2" />
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

                <LeadFilters 
                    isOpen={isFilterModalOpen}
                    onClose={() => setIsFilterModalOpen(false)}
                    filters={filters}
                    setFilters={setFilters}
                    availableCities={availableCities}
                />
            </main>
            {/* Save Config Modal */}
            {isSaveModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#0f172a] border border-white/10 rounded-[2rem] w-full max-w-md p-8 shadow-2xl">
                        <h3 className="text-xl font-black text-white uppercase italic tracking-tighter mb-6">Save Sniper Template</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Configuration Name</label>
                                <input
                                    type="text"
                                    value={newConfigName}
                                    onChange={(e) => setNewConfigName(e.target.value)}
                                    placeholder="e.g. Aggressive Toyota SF"
                                    className="w-full bg-slate-950/50 border border-white/5 rounded-2xl px-6 py-4 text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-all font-bold placeholder:text-slate-700"
                                />
                            </div>
                            <div className="flex items-center gap-3 pt-4">
                                <button
                                    onClick={() => setIsSaveModalOpen(false)}
                                    className="flex-1 bg-slate-900 text-slate-400 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-white transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveAsNew}
                                    disabled={!newConfigName.trim() || saving}
                                    className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-600/20 disabled:opacity-50"
                                >
                                    {saving ? 'Saving...' : 'Confirm Save'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Load Config Modal */}
            {isLoadModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#0f172a] border border-white/10 rounded-[2rem] w-full max-w-lg p-8 shadow-2xl flex flex-col max-h-[80vh]">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Load Strategy</h3>
                            <button onClick={() => setIsLoadModalOpen(false)} className="text-slate-500 hover:text-white transition-all">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                            {savedConfigs.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-3xl">
                                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">No templates found</p>
                                </div>
                            ) : (
                                savedConfigs.map((cfg: SavedConfig) => (
                                    <div 
                                        key={cfg.id}
                                        onClick={() => handleLoadConfig(cfg.config)}
                                        className="group bg-slate-950/40 border border-white/5 hover:border-indigo-500/40 rounded-3xl p-6 cursor-pointer transition-all hover:bg-slate-900/60"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-white font-black uppercase italic tracking-tight text-lg group-hover:text-indigo-400 transition-colors">
                                                    {cfg.name}
                                                </span>
                                                <span className="text-slate-600 font-bold text-[9px] uppercase tracking-[0.2em] mt-1">
                                                    Modified: {new Date(cfg.updated_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={(e) => handleDeleteConfig(e, cfg.id)}
                                                    className="p-3 text-slate-700 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-indigo-500 text-slate-600 group-hover:text-white transition-all">
                                                    <Plus className="rotate-45" size={18} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
