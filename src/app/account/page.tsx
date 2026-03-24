"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Navbar } from '@/components/Navbar';
// @ts-ignore
import { User, Mail, Shield, Save, LogOut, Camera, Loader2, CheckCircle2 } from 'lucide-react';

export default function AccountPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState(null as any);
    const [profile, setProfile] = useState({
        full_name: '',
        email: '',
        avatar_url: ''
    });
    const [success, setSuccess] = useState(null as string | null);
    const [error, setError] = useState(null as string | null);

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUser(user);
                setProfile({
                    full_name: user.user_metadata?.full_name || '',
                    email: user.email || '',
                    avatar_url: user.user_metadata?.avatar_url || ''
                });
            }
            setLoading(false);
        };
        fetchUser();
    }, []);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            const { error } = await supabase.auth.updateUser({
                data: { full_name: profile.full_name }
            });

            if (error) throw error;

            setSuccess('Profile updated successfully!');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        window.location.href = '/login';
    };

    if (loading) return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center">
            <div className="animate-pulse text-indigo-500 font-black uppercase tracking-[0.2em] text-xs italic">Syncing Profile...</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#020617] text-slate-50 relative overflow-hidden font-sans">
            {/* Background Glows */}
            <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-[150px] -z-10" />
            <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-emerald-600/5 rounded-full blur-[120px] -z-10" />

            <Navbar />

            <main className="max-w-4xl mx-auto px-4 py-20 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-6 mb-16">
                    <div>
                        <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full text-[10px] font-black tracking-[0.2em] uppercase mb-4 animate-pulse">
                            <Shield size={14} className="fill-current" />
                            SECURE ACCESS NODE
                        </div>
                        <h1 className="text-6xl font-black text-white uppercase tracking-tighter italic leading-none">
                            Personal <span className="text-indigo-500">Account</span>
                        </h1>
                        <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px] mt-2 ml-1 opacity-70">Identity Management • Security Guardrails</p>
                    </div>

                    <button
                        onClick={handleSignOut}
                        className="flex items-center gap-2 px-6 py-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all group"
                    >
                        <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Decommission Session
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    {/* Left Col: Avatar & Status */}
                    <div className="space-y-8">
                        <section className="glass-card p-10 rounded-[3rem] text-center border border-white/5 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            
                            <div className="relative inline-block mb-6">
                                <div className="w-32 h-32 rounded-[2.5rem] bg-indigo-600 flex items-center justify-center text-white text-5xl font-black italic shadow-2xl shadow-indigo-500/40 relative z-10 overflow-hidden">
                                    {profile.avatar_url ? (
                                        <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        profile.full_name.charAt(0) || <User size={48} />
                                    )}
                                </div>
                                <button className="absolute -bottom-2 -right-2 p-3 bg-slate-900 border border-white/10 rounded-2xl text-indigo-400 hover:text-white transition-all shadow-xl z-20 hover:scale-110">
                                    <Camera size={18} />
                                </button>
                            </div>

                            <h2 className="text-xl font-black text-white uppercase tracking-tight italic mb-1">{profile.full_name || 'Anonymous User'}</h2>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest italic">{profile.email}</p>

                            <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                    <span className="text-slate-500">Security Clearance</span>
                                    <span className="text-indigo-400">Level 4</span>
                                </div>
                                <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                                    <div className="w-3/4 h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                    <span className="text-slate-500">System Status</span>
                                    <span className="text-emerald-400 flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                        Operational
                                    </span>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right Col: Forms */}
                    <div className="md:col-span-2 space-y-12">
                        <section className="glass-card p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group border border-white/5">
                            <div className="absolute top-0 right-0 p-12 opacity-[0.05] group-hover:opacity-10 transition-opacity -z-10">
                                <User size={140} className="text-indigo-500" />
                            </div>

                            <div className="flex items-center gap-5 mb-10">
                                <div className="flex items-center justify-center w-12 h-12 bg-indigo-600 rounded-[1.25rem] text-white font-black text-xl italic shadow-2xl shadow-indigo-500/40">ID</div>
                                <div>
                                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">Identity Matrix</h2>
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.25em] opacity-70">Core user identifiers and metadata</p>
                                </div>
                            </div>

                            <form onSubmit={handleUpdateProfile} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
                                            <User size={12} className="text-indigo-400" /> Full Signature
                                        </label>
                                        <input
                                            type="text"
                                            value={profile.full_name}
                                            onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                                            className="w-full bg-slate-950/60 border border-white/5 rounded-2xl p-5 font-black text-white focus:bg-slate-950 transition-all text-sm px-8"
                                            placeholder="Enter your name"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
                                            <Mail size={12} className="text-indigo-400" /> Neural Link (Email)
                                        </label>
                                        <input
                                            type="email"
                                            value={profile.email}
                                            disabled
                                            className="w-full bg-slate-950/40 border border-white/5 rounded-2xl p-5 font-black text-slate-600 cursor-not-allowed text-sm px-8"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-8 border-t border-white/5">
                                    <div className="flex items-center gap-3">
                                        {success && (
                                            <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-left-4">
                                                <CheckCircle2 size={16} />
                                                Changes Hardened
                                            </div>
                                        )}
                                        {error && (
                                            <div className="text-red-400 text-[10px] font-black uppercase tracking-widest animate-pulse">
                                                System error: {error}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-500/20 transition-all hover:scale-105 flex items-center gap-3 disabled:bg-indigo-900"
                                    >
                                        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                        Hard-Save Changes
                                    </button>
                                </div>
                            </form>
                        </section>

                        <section className="glass-card p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group border border-white/5">
                            <div className="flex items-center gap-5 mb-10">
                                <div className="flex items-center justify-center w-12 h-12 bg-slate-900 border border-white/5 rounded-[1.25rem] text-indigo-400 font-black text-xl italic">PX</div>
                                <div>
                                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">Security Protocols</h2>
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.25em] opacity-70">Passphrase rotation and active shield management</p>
                                </div>
                            </div>
                            
                            <div className="p-8 bg-slate-950/60 border border-white/5 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="flex items-center gap-6">
                                    <div className="p-4 bg-indigo-500/10 rounded-2xl text-indigo-400">
                                        <Shield size={24} />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-black text-white uppercase tracking-tight italic">Password Safeguard</h3>
                                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-1">Rotation required every 90 cycles</p>
                                    </div>
                                </div>
                                <button className="w-full md:w-auto px-6 py-3 border border-white/5 bg-white/5 rounded-2xl text-[10px] font-black text-slate-400 hover:bg-white/10 hover:text-white transition-all uppercase tracking-widest">
                                    Init Rotation
                                </button>
                            </div>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}
