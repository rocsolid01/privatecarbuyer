"use client";

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Loader2 } from 'lucide-react';

type Message = {
    role: 'user' | 'assistant';
    content: string;
};

const SUGGESTED = [
    'How do I read the AI Score?',
    'What does 🔥 mean in Seller Intent?',
    'What filters should I set daily?',
    'How do I find the best deals?',
];

export function ChatWidget() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Hey! Ask me anything about how Private Car Buyer works — scores, filters, the table, anything.' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [open]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    const send = async (text: string) => {
        const trimmed = text.trim();
        if (!trimmed || loading) return;

        const userMsg: Message = { role: 'user', content: trimmed };
        const next = [...messages, userMsg];
        setMessages(next);
        setInput('');
        setLoading(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: next }),
            });
            const data = await res.json();
            setMessages(m => [...m, { role: 'assistant', content: data.reply ?? 'Sorry, something went wrong.' }]);
        } catch {
            setMessages(m => [...m, { role: 'assistant', content: 'Connection error. Try again.' }]);
        } finally {
            setLoading(false);
        }
    };

    const showSuggested = messages.length === 1;

    return (
        <>
            {/* Chat panel */}
            {open && (
                <div className="fixed bottom-24 right-6 z-[200] w-[340px] bg-[#0c1018] border border-white/10 rounded-3xl shadow-[0_40px_100px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden"
                    style={{ maxHeight: 'calc(100vh - 140px)' }}>

                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-[#0d1117]">
                        <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-xl bg-indigo-600 flex items-center justify-center shadow-[0_0_16px_rgba(99,102,241,0.5)]">
                                <MessageSquare size={13} className="text-white" />
                            </div>
                            <div>
                                <p className="text-[11px] font-black text-white uppercase tracking-widest leading-none">PCB Assistant</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                    <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Online</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setOpen(false)}
                            className="p-1.5 rounded-xl text-slate-600 hover:text-white hover:bg-white/5 transition-all">
                            <X size={15} />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 custom-scrollbar">
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-[11px] font-medium leading-relaxed ${
                                    m.role === 'user'
                                        ? 'bg-indigo-600 text-white rounded-br-sm'
                                        : 'bg-slate-800/80 text-slate-300 border border-white/5 rounded-bl-sm'
                                }`}>
                                    {m.content}
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-slate-800/80 border border-white/5 rounded-2xl rounded-bl-sm px-3.5 py-2.5 flex items-center gap-2">
                                    <Loader2 size={11} className="text-indigo-400 animate-spin" />
                                    <span className="text-[10px] text-slate-500 font-medium">Thinking...</span>
                                </div>
                            </div>
                        )}

                        {/* Suggested questions */}
                        {showSuggested && (
                            <div className="space-y-1.5 pt-1">
                                {SUGGESTED.map((q, i) => (
                                    <button key={i} onClick={() => send(q)}
                                        className="w-full text-left text-[10px] font-medium text-slate-400 bg-slate-900/60 border border-white/5 hover:border-indigo-500/30 hover:text-white px-3 py-2 rounded-xl transition-all">
                                        {q}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div ref={bottomRef} />
                    </div>

                    {/* Input */}
                    <div className="px-4 py-3 border-t border-white/5 bg-[#0d1117]">
                        <div className="flex items-center gap-2 bg-slate-900 border border-white/5 rounded-2xl px-3 py-2 focus-within:border-indigo-500/40 transition-all">
                            <input
                                ref={inputRef}
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send(input)}
                                placeholder="Ask how the app works..."
                                className="flex-1 bg-transparent text-[11px] text-white placeholder-slate-600 outline-none font-medium"
                            />
                            <button
                                onClick={() => send(input)}
                                disabled={!input.trim() || loading}
                                className="p-1.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 shrink-0">
                                <Send size={11} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toggle button */}
            <button
                onClick={() => setOpen(o => !o)}
                className={`fixed bottom-6 right-6 z-[200] w-14 h-14 rounded-2xl flex items-center justify-center shadow-[0_8px_40px_rgba(99,102,241,0.5)] transition-all active:scale-95 ${
                    open
                        ? 'bg-slate-800 border border-white/10 text-slate-400 hover:text-white'
                        : 'bg-indigo-600 text-white hover:bg-indigo-500 border border-indigo-400/20'
                }`}
            >
                {open ? <X size={20} /> : <MessageSquare size={20} />}
            </button>
        </>
    );
}
