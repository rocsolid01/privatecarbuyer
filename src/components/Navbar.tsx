"use client";

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Car, Zap, Clock, ArrowRight, BookOpen, X } from 'lucide-react';

const NAV_ITEMS = [
    { href: '/settings',  icon: Zap,      label: 'Control Center' },
    { href: '/analytics', icon: Clock,    label: 'Analytics' },
    { href: '/playbook',  icon: BookOpen, label: 'Playbook' },
];

export const Navbar = () => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const pathname = usePathname();

    return (
        <nav className="glass-card sticky top-0 z-50 !bg-slate-950/40 backdrop-blur-xl border-b border-white/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">

                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 shrink-0">
                        <div className="bg-indigo-600 p-1.5 rounded-lg shadow-lg shadow-indigo-500/20">
                            <Car className="text-white" size={22} />
                        </div>
                        <span className="font-black text-lg tracking-tight text-white uppercase italic">
                            PRIVATE CAR <span className="text-indigo-500">BUYER</span>
                        </span>
                    </Link>

                    {/* Desktop nav */}
                    <div className="hidden md:flex items-center gap-1">
                        {NAV_ITEMS.map((item) => {
                            const active = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-200 group ${
                                        active
                                            ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/20'
                                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    <item.icon size={14} className="group-hover:scale-110 transition-transform shrink-0" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-3">
                        <Link
                            href="/login"
                            className="hidden md:flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-slate-300 transition-colors"
                        >
                            <ArrowRight size={14} />
                            Sign Out
                        </Link>

                        {/* Hamburger — mobile only */}
                        <button
                            onClick={() => setMobileOpen(o => !o)}
                            className="md:hidden flex flex-col justify-center items-center w-9 h-9 gap-[5px] rounded-xl bg-slate-900 border border-white/5 hover:border-indigo-500/30 transition-all"
                            aria-label="Toggle menu"
                        >
                            {mobileOpen ? (
                                <X size={16} className="text-slate-300" />
                            ) : (
                                <>
                                    <span className="w-4 h-[2px] bg-slate-400 rounded-full" />
                                    <span className="w-4 h-[2px] bg-slate-400 rounded-full" />
                                    <span className="w-4 h-[2px] bg-slate-400 rounded-full" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile dropdown */}
            {mobileOpen && (
                <div className="md:hidden border-t border-white/5 bg-slate-950/95 backdrop-blur-xl">
                    <div className="max-w-7xl mx-auto px-4 py-3 space-y-1">
                        {NAV_ITEMS.map((item) => {
                            const active = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setMobileOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                                        active
                                            ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/20'
                                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    <item.icon size={15} />
                                    {item.label}
                                </Link>
                            );
                        })}
                        <div className="pt-1 border-t border-white/5 mt-1">
                            <Link
                                href="/login"
                                onClick={() => setMobileOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-600 hover:text-slate-300 transition-colors"
                            >
                                <ArrowRight size={15} />
                                Sign Out
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};
