"use client";

import Link from 'next/link';
import { Car, Zap, Target, Shield, ArrowRight, CheckCircle2, Star, Smartphone, Globe } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="bg-[#020617] text-slate-50 min-h-screen font-sans selection:bg-indigo-500/30">

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-slate-950/40 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
              <Car className="text-white" size={24} />
            </div>
            <span className="font-black text-xl tracking-tighter text-white uppercase italic">
              PRIVATE CAR <span className="text-indigo-500">BUYER</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-10 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            <a href="#features" className="hover:text-indigo-400 transition-colors">The Tech</a>
            <a href="#pricing" className="hover:text-indigo-400 transition-colors">Pricing</a>
            <a href="#how-it-works" className="hover:text-indigo-400 transition-colors">The Engine</a>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-indigo-400 transition-colors">Log In</Link>
            <Link href="/dashboard" className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-500/20 transition-all hover:scale-105">
              Access Feed
            </Link>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-to-b from-blue-50/50 dark:from-blue-900/10 to-transparent -z-10" />
          <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-4 py-1.5 rounded-full text-[10px] font-black tracking-[0.2em] uppercase mb-8 animate-pulse">
              <Zap size={14} className="fill-current" />
              ELITE LEAD ACQUISITION
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-white mb-8 leading-[1] tracking-tighter">
              Scrape. Score. <span className="bg-clip-text text-transparent bg-gradient-to-br from-indigo-400 via-emerald-400 to-indigo-500">Contact.</span> <br />
              IN BLINK OF AN EYE.
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
              The automated vehicle acquisition platform for elite dealers. Using AI to find 20%+ margin deals and send personalized SMS before your competitors even wake up.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-20">
              <Link href="/dashboard" className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-5 rounded-2xl font-black text-lg shadow-2xl shadow-indigo-500/40 flex items-center justify-center gap-3 hover:scale-105 transition-all">
                Access Dashboard <ArrowRight size={20} />
              </Link>
              <a href="#how-it-works" className="w-full sm:w-auto glass-card px-10 py-5 rounded-2xl font-black text-lg text-white hover:bg-white/5 transition-all flex items-center justify-center gap-2">
                The Engine
              </a>
            </div>

            {/* Mock Dashboard Preview */}
            <div className="relative max-w-5xl mx-auto mt-12 animate-in slide-in-from-bottom-12 duration-1000">
              <div className="absolute -inset-20 bg-[radial-gradient(circle_at_center,_var(--primary-glow),_transparent)] blur-3xl opacity-40 -z-10" />
              <div className="glass-card rounded-[3rem] p-3 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                <div className="bg-slate-950/80 rounded-[2rem] overflow-hidden border border-white/5 h-[500px] flex items-center justify-center text-slate-600 font-black tracking-widest text-xs uppercase italic relative">
                  <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none" />
                  <div className="text-center relative z-10">
                    <div className="mb-6 inline-block bg-indigo-500/20 p-6 rounded-full">
                      <Smartphone size={64} className="text-indigo-400" />
                    </div>
                    <div>LIVE SNIPER FEED ACTIVE</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 border-y border-slate-100 dark:border-slate-800/50">
          <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <p className="text-4xl font-black text-blue-600 mb-2">15m</p>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Scrape Interval</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-black text-blue-600 mb-2">12%</p>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Avg. Close Rate</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-black text-blue-600 mb-2">$2,4k</p>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Avg. Margin/Unit</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-black text-blue-600 mb-2">24/7</p>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">AI Protection</p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-32">
          <div className="max-w-7xl mx-auto px-4 text-center mb-20">
            <h2 className="text-base font-black text-blue-600 uppercase tracking-[0.2em] mb-4">Core Technology</h2>
            <h3 className="text-4xl md:text-5xl font-black dark:text-white">Engineered for First-Contact Advantage</h3>
          </div>
          <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-slate-50 dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 group hover:border-blue-500 transition-all duration-500">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-600/20 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-8 group-hover:scale-110 transition-transform">
                <Globe size={32} />
              </div>
              <h4 className="text-2xl font-black dark:text-white mb-4">Hyper-Scraper 4.0</h4>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                Powered by Apify, we crawl Craigslist every 5-15 minutes using rotating proxies. Max volume, zero exclusions.
              </p>
            </div>
            <div className="p-8 bg-slate-50 dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 group hover:border-emerald-500 transition-all duration-500">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-600/20 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-8 group-hover:scale-110 transition-transform">
                <Target size={32} />
              </div>
              <h4 className="text-2xl font-black dark:text-white mb-4">Infermatic AI Scoring</h4>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                Our AI analyzes post history, KBB data, and seller sentiment to score "must sell" motivation signals instantly.
              </p>
            </div>
            <div className="p-8 bg-slate-50 dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 group hover:border-purple-500 transition-all duration-500">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-600/20 rounded-2xl flex items-center justify-center text-purple-600 dark:text-purple-400 mb-8 group-hover:scale-110 transition-transform">
                <Smartphone size={32} />
              </div>
              <h4 className="text-2xl font-black dark:text-white mb-4">Automated Outreach</h4>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                Telnyx-powered SMS sends personalized offers the moment a match is found. "Bottom dollar" verification included.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-32 bg-slate-50 dark:bg-slate-900/50">
          <div className="max-w-7xl mx-auto px-4 text-center mb-20">
            <h2 className="text-base font-black text-blue-600 uppercase tracking-[0.2em] mb-4">Scaling Plans</h2>
            <h3 className="text-4xl md:text-5xl font-black dark:text-white">Simple, Tiered Pricing</h3>
          </div>
          <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Starter */}
            <div className="bg-white dark:bg-slate-950 p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 flex flex-col">
              <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Solo Dealer</p>
              <h4 className="text-5xl font-black dark:text-white mb-8">$29 <span className="text-lg text-slate-400">/mo</span></h4>
              <ul className="space-y-4 mb-10 flex-1">
                <li className="flex items-center gap-3 text-slate-600 dark:text-slate-400 font-medium">
                  <CheckCircle2 size={18} className="text-blue-500" /> 1 Location Area
                </li>
                <li className="flex items-center gap-3 text-slate-600 dark:text-slate-400 font-medium">
                  <CheckCircle2 size={18} className="text-blue-500" /> 1,000 Scrapes /mo
                </li>
                <li className="flex items-center gap-3 text-slate-600 dark:text-slate-400 font-medium">
                  <CheckCircle2 size={18} className="text-blue-500" /> Basic AI Scoring
                </li>
              </ul>
              <button className="w-full py-4 border-2 border-slate-900 dark:border-white rounded-2xl font-black hover:bg-slate-900 dark:hover:bg-white hover:text-white dark:hover:text-slate-900 transition-all">
                Select Starter
              </button>
            </div>

            {/* Pro - Featured */}
            <div className="bg-white dark:bg-slate-950 p-10 rounded-[2.5rem] border-2 border-blue-600 flex flex-col relative scale-105 shadow-2xl shadow-blue-500/10">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-xs font-black tracking-widest uppercase">Most Popular</div>
              <p className="text-sm font-black text-blue-600 uppercase tracking-widest mb-4">High Volume</p>
              <h4 className="text-5xl font-black dark:text-white mb-8">$59 <span className="text-lg text-slate-400">/mo</span></h4>
              <ul className="space-y-4 mb-10 flex-1">
                <li className="flex items-center gap-3 text-slate-600 dark:text-slate-400 font-medium">
                  <CheckCircle2 size={18} className="text-blue-500" /> Multi-State Coverage
                </li>
                <li className="flex items-center gap-3 text-slate-600 dark:text-slate-400 font-medium">
                  <CheckCircle2 size={18} className="text-blue-500" /> 5,000 Scrapes /mo
                </li>
                <li className="flex items-center gap-3 text-slate-600 dark:text-slate-400 font-medium">
                  <CheckCircle2 size={18} className="text-blue-500" /> Advanced AI Negotiation
                </li>
                <li className="flex items-center gap-3 text-slate-600 dark:text-slate-400 font-medium">
                  <CheckCircle2 size={18} className="text-blue-500" /> priority SMS Queue
                </li>
              </ul>
              <button className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-500/30 hover:bg-blue-700 transition-all">
                Select Pro
              </button>
            </div>

            {/* Enterprise */}
            <div className="bg-white dark:bg-slate-950 p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 flex flex-col">
              <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Dealership Group</p>
              <h4 className="text-5xl font-black dark:text-white mb-8">$99 <span className="text-lg text-slate-400">/mo</span></h4>
              <ul className="space-y-4 mb-10 flex-1">
                <li className="flex items-center gap-3 text-slate-600 dark:text-slate-400 font-medium">
                  <CheckCircle2 size={18} className="text-blue-500" /> Unlimited Radius
                </li>
                <li className="flex items-center gap-3 text-slate-600 dark:text-slate-400 font-medium">
                  <CheckCircle2 size={18} className="text-blue-500" /> 50,000 Scrapes /mo
                </li>
                <li className="flex items-center gap-3 text-slate-600 dark:text-slate-400 font-medium">
                  <CheckCircle2 size={18} className="text-blue-500" /> Full CRM Integration
                </li>
              </ul>
              <button className="w-full py-4 border-2 border-slate-900 dark:border-white rounded-2xl font-black hover:bg-slate-900 dark:hover:bg-white hover:text-white dark:hover:text-slate-900 transition-all">
                Contact Sales
              </button>
            </div>
          </div>
        </section>

        {/* CTA Footer */}
        <section className="py-32 overflow-hidden relative">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-4xl md:text-6xl font-black dark:text-white mb-8">Ready to dominate your local market?</h2>
            <p className="text-xl text-slate-500 dark:text-slate-400 mb-12 max-w-xl mx-auto">
              Join 500+ dealerships using AI to secure high-margin private party inventory before it hits the retail market.
            </p>
            <Link href="/dashboard" className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-2xl font-black text-xl shadow-2xl shadow-blue-500/40 transition-all hover:scale-105 inline-block">
              Get Started for Free
            </Link>
          </div>
        </section>
      </main>

      <footer className="py-20 border-t border-slate-100 dark:border-slate-900">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 grayscale brightness-0 dark:invert opacity-50">
            <Car size={20} />
            <span className="font-black tracking-tight">PRIVATE CAR BUYER</span>
          </div>
          <p className="text-sm text-slate-400 font-medium">© 2024 Private Car Buyer Corp. TCPA Compliant. All rights reserved.</p>
          <div className="flex gap-8">
            <a href="#" className="font-bold text-slate-400 hover:text-blue-600 transition-colors">Privacy</a>
            <a href="#" className="font-bold text-slate-400 hover:text-blue-600 transition-colors">Terms</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
