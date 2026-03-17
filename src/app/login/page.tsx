"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Car, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
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
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 font-sans">

            {/* Logo Link */}
            <Link href="/" className="flex items-center gap-2 mb-12 hover:scale-105 transition-transform">
                <div className="bg-blue-600 p-2 rounded-xl shadow-xl shadow-blue-500/20">
                    <Car className="text-white" size={28} />
                </div>
                <span className="font-black text-2xl tracking-tighter dark:text-white">
                    PRIVATE CAR <span className="text-blue-600">BUYER</span>
                </span>
            </Link>

            <div className="w-full max-w-md">
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-8 md:p-12">

                    <div className="mb-10 text-center">
                        <h1 className="text-3xl font-black dark:text-white mb-2">
                            {isLogin ? 'Welcome Back' : 'Get Started'}
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">
                            {isLogin ? 'Enter your details to access your dashboard' : 'Join the elite network of automated car buyers'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Email Address</label>
                            <div className="relative">

                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@dealership.com"
                                    required
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 dark:text-white transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center pl-1">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Password</label>
                                {isLogin && (
                                    <Link href="#" className="text-xs font-bold text-blue-600 hover:underline">Forgot?</Link>
                                )}
                            </div>
                            <div className="relative">

                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 dark:text-white transition-all"
                                />
                            </div>
                        </div>

                        <button
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-blue-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            {loading ? 'Authenticating...' : isLogin ? 'Sign In' : 'Create Account'}
                            {!loading && <ArrowRight size={20} />}
                        </button>
                    </form>

                    <div className="mt-8 relative text-center">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100 dark:border-slate-800"></div></div>
                        <span className="relative bg-white dark:bg-slate-900 px-4 text-xs font-black text-slate-400 uppercase tracking-widest">Or continue with</span>
                    </div>

                    <div className="mt-8 grid grid-cols-2 gap-4">
                        <button className="flex items-center justify-center gap-2 py-3 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-sm dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                            Google
                        </button>
                        <button className="flex items-center justify-center gap-2 py-3 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-sm dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                            GitHub
                        </button>
                    </div>
                </div>

                <p className="mt-8 text-center text-sm font-bold text-slate-500">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-blue-600 hover:underline"
                    >
                        {isLogin ? 'Sign up free' : 'Log in here'}
                    </button>
                </p>
            </div>
        </div>
    );
}
