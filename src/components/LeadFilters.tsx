"use client";

import React from 'react';
import { 
    Target, 
    X, 
    DollarSign, 
    TrendingUp, 
    MapPin, 
} from 'lucide-react';
import { Lead } from '@/types/database';

export interface DealershipFilters {
    search: string;
    city: string;
    minYear: string;
    maxYear: string;
    minPrice: string;
    maxPrice: string;
    maxMileage: string;
    minMargin: string;
    status: string;
    titleStatus: string;
}

interface LeadFiltersProps {
    isOpen: boolean;
    onClose: () => void;
    filters: DealershipFilters;
    setFilters: (filters: DealershipFilters) => void;
    availableCities: string[];
}

export const LeadFilters: React.FC<LeadFiltersProps> = ({ 
    isOpen,
    onClose,
    filters, 
    setFilters,
    availableCities 
}: LeadFiltersProps) => {
    const handleChange = (key: keyof DealershipFilters, value: string) => {
        setFilters({ ...filters, [key]: value });
    };

    const resetFilters = () => {
        setFilters({
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
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose} />
            
            <div className="relative w-full max-w-4xl bg-[#020617] border border-white/10 rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.9)] overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-8 border-b border-white/5 flex items-center justify-between bg-slate-950/40">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 glow-indigo">
                            <Target size={24} className="text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white uppercase italic tracking-widest leading-none">Dealership Intel Filters</h3>
                            <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 italic tracking-tighter">Target Parameters & Acquisition Guardrails</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={resetFilters}
                            className="flex items-center gap-2 px-6 py-3 bg-slate-900 border border-white/5 rounded-2xl text-[10px] font-black text-slate-400 uppercase italic hover:text-white transition-all active:scale-95"
                        >
                            <X size={14} />
                            Reset Logic
                        </button>
                        <button 
                            onClick={onClose}
                            className="w-12 h-12 flex items-center justify-center bg-slate-900 border border-white/5 rounded-2xl text-slate-500 hover:text-red-500 transition-all active:scale-95"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-10 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Text Intercept */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-2">Text Intercept</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Make, model, or title..."
                                    value={filters.search}
                                    onChange={(e) => handleChange('search', e.target.value)}
                                    className="w-full bg-slate-950/60 border border-white/5 rounded-2xl py-4 pl-6 pr-10 text-xs text-white font-bold placeholder:text-slate-700 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all outline-none italic"
                                />
                            </div>
                        </div>

                        {/* City Filter */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-2">Geographic Zone</label>
                            <select
                                value={filters.city}
                                onChange={(e) => handleChange('city', e.target.value)}
                                className="w-full bg-slate-950/60 border border-white/5 rounded-2xl py-4 px-6 text-xs text-white font-bold focus:border-indigo-500/50 transition-all outline-none italic appearance-none cursor-pointer"
                            >
                                <option value="">ALL SECTORS</option>
                                {availableCities.map((city: string) => (
                                    <option key={city} value={city}>{city.toUpperCase()}</option>
                                ))}
                            </select>
                        </div>

                        {/* Year Range */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-2">Vintage Range (Year)</label>
                            <div className="flex gap-4">
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={filters.minYear}
                                    onChange={(e) => handleChange('minYear', e.target.value)}
                                    className="w-1/2 bg-slate-950/60 border border-white/5 rounded-2xl py-4 px-6 text-xs text-white font-bold focus:border-indigo-500/50 transition-all outline-none italic"
                                />
                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={filters.maxYear}
                                    onChange={(e) => handleChange('maxYear', e.target.value)}
                                    className="w-1/2 bg-slate-950/60 border border-white/5 rounded-2xl py-4 px-6 text-xs text-white font-bold focus:border-indigo-500/50 transition-all outline-none italic"
                                />
                            </div>
                        </div>

                        {/* Price Range */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-2">Capital Outlay (Price)</label>
                            <div className="flex gap-4">
                                <div className="relative w-1/2">
                                    <DollarSign size={10} className="absolute left-6 top-5 text-slate-500" />
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        value={filters.minPrice}
                                        onChange={(e) => handleChange('minPrice', e.target.value)}
                                        className="w-full bg-slate-950/60 border border-white/5 rounded-2xl py-4 pl-10 pr-6 text-xs text-white font-bold focus:border-indigo-500/50 transition-all outline-none italic"
                                    />
                                </div>
                                <div className="relative w-1/2">
                                    <DollarSign size={10} className="absolute left-6 top-5 text-slate-500" />
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        value={filters.maxPrice}
                                        onChange={(e) => handleChange('maxPrice', e.target.value)}
                                        className="w-full bg-slate-950/60 border border-white/5 rounded-2xl py-4 pl-10 pr-6 text-xs text-white font-bold focus:border-indigo-500/50 transition-all outline-none italic"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Logistics */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-2">Odometer & Title</label>
                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    type="number"
                                    placeholder="Max Miles"
                                    value={filters.maxMileage}
                                    onChange={(e) => handleChange('maxMileage', e.target.value)}
                                    className="w-full bg-slate-950/60 border border-white/5 rounded-2xl py-4 px-6 text-xs text-white font-bold focus:border-indigo-500/50 transition-all outline-none italic"
                                />
                                <select
                                    value={filters.titleStatus}
                                    onChange={(e) => handleChange('titleStatus', e.target.value)}
                                    className="w-full bg-slate-950/60 border border-white/5 rounded-2xl py-4 px-6 text-xs text-white font-bold focus:border-indigo-500/50 transition-all outline-none italic appearance-none cursor-pointer"
                                >
                                    <option value="">ANY TITLE</option>
                                    <option value="Clean">CLEAN ONLY</option>
                                    <option value="Salvage">SALVAGE/REBUILT</option>
                                </select>
                            </div>
                        </div>

                        {/* Protocol Status */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-2">Pipeline Node</label>
                            <select
                                value={filters.status}
                                onChange={(e) => handleChange('status', e.target.value)}
                                className="w-full bg-slate-950/60 border border-white/5 rounded-2xl py-4 px-6 text-xs text-white font-bold focus:border-indigo-500/50 transition-all outline-none italic appearance-none cursor-pointer"
                            >
                                <option value="">ALL STATUSES</option>
                                <option value="New">NEW NODES</option>
                                <option value="Contacted">CONTACTED</option>
                                <option value="Negotiating">NEGOTIATING</option>
                                <option value="Bought">ACQUIRED</option>
                                <option value="Dead">NEUTRALIZED</option>
                            </select>
                        </div>

                        {/* Margin Filter */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-2">Estimated Margin (ROI)</label>
                            <div className="relative">
                                <TrendingUp size={14} className="absolute left-6 top-5 text-indigo-500" />
                                <input
                                    type="number"
                                    placeholder="Min Est. Margin"
                                    value={filters.minMargin}
                                    onChange={(e) => handleChange('minMargin', e.target.value)}
                                    className="w-full bg-slate-950/60 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-xs text-white font-bold focus:border-indigo-500/50 transition-all outline-none italic"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-white/5 bg-slate-950/40 flex justify-end">
                    <button 
                        onClick={onClose}
                        className="px-12 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase italic tracking-widest rounded-2xl shadow-2xl shadow-indigo-500/20 active:scale-95 transition-all text-xs"
                    >
                        Apply Parameters
                    </button>
                </div>
            </div>
        </div>
    );
};
