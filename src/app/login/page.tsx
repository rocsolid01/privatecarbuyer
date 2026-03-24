"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Car, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null as string | null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isLogin) {
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (signInError) throw signInError;
            } else {
                const { error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName,
                        },
                        emailRedirectTo: `${window.location.origin}/auth/callback`,
                    },
                });
                if (signUpError) throw signUpError;
                alert('Check your email for the confirmation link!');
            }
            window.location.href = '/settings';
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] text-slate-50 flex flex-col items-center justify-center p-4 font-sans selection:bg-indigo-500/30">

            {/* Logo Link */}
            <Link href="/" className="flex items-center gap-2 mb-12 hover:scale-105 transition-all group">
                <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all">
                    <Car className="text-white" size={28} />
                </div>
                <span className="font-black text-2xl tracking-tighter text-white uppercase italic">
                    PRIVATE CAR <span className="text-indigo-500">BUYER</span>
                </span>
            </Link>

            <div className="w-full max-w-md">
                <div className="glass-card rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden p-8 md:p-12 relative">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.05] -z-10">
                        <Car size={120} className="text-indigo-500" />
                    </div>

                    <div className="mb-10 text-center">
                        <h1 className="text-4xl font-black text-white mb-2 uppercase tracking-tighter italic">
                            {isLogin ? 'Welcome Back' : 'Join Elite'}
                        </h1>
                        <p className="text-slate-500 font-black uppercase tracking-[0.1em] text-[10px]">
                            {isLogin ? 'Access Control Center • Live Feeds' : 'Autonomous Sourcing • Zero Competition'}
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-black uppercase tracking-widest text-center italic animate-pulse">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {!isLogin && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] pl-1">Full Name</label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="John Doe"
                                    required={!isLogin}
                                    className="w-full bg-slate-950/60 border border-white/5 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-indigo-500/50 text-white font-black text-sm transition-all focus:bg-slate-950"
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] pl-1">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@dealership.com"
                                required
                                className="w-full bg-slate-950/60 border border-white/5 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-indigo-500/50 text-white font-black text-sm transition-all focus:bg-slate-950"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center pl-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Password</label>
                                {isLogin && (
                                    <Link href="#" className="text-[9px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-widest italic underline underline-offset-4">Forgot?</Link>
                                )}
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full bg-slate-950/60 border border-white/5 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-indigo-500/50 text-white font-black text-sm transition-all focus:bg-slate-950"
                            />
                        </div>

                        <button
                            disabled={loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-indigo-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 uppercase tracking-tighter italic"
                        >
                            {loading ? 'Authenticating...' : isLogin ? 'Access System' : 'Deploy Account'}
                            {!loading && <ArrowRight size={20} />}
                        </button>
                    </form>

                    <div className="mt-8 relative text-center">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                        <span className="relative bg-[#020617] px-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] italic">Or continue with</span>
                    </div>

                    <div className="mt-8 grid grid-cols-2 gap-4">
                        <button className="flex items-center justify-center gap-2 py-3 border border-white/5 bg-white/5 rounded-2xl font-black text-[10px] text-slate-400 hover:bg-white/10 hover:text-white transition-all uppercase tracking-widest">
                            Google
                        </button>
                        <button className="flex items-center justify-center gap-2 py-3 border border-white/5 bg-white/5 rounded-2xl font-black text-[10px] text-slate-400 hover:bg-white/10 hover:text-white transition-all uppercase tracking-widest">
                            GitHub
                        </button>
                    </div>
                </div>

                <p className="mt-8 text-center text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                    {isLogin ? "No clearances?" : "Already sanctioned?"}{' '}
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-indigo-500 hover:text-indigo-400 underline underline-offset-4 italic"
                    >
                        {isLogin ? 'Request Access' : 'Authenticate Here'}
                    </button>
                </p>
            </div>
        </div>
    );
}
