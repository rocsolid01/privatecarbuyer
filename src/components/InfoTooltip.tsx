"use client";

import React, { useState } from 'react';
import { Info } from 'lucide-react';

interface InfoTooltipProps {
    content: string;
    className?: string;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({ content, className = "" }) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div
            className={`relative inline-flex items-center group cursor-help ${className}`}
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
            onClick={(e) => {
                e.stopPropagation();
                setIsVisible(!isVisible);
            }}
        >
            <Info
                size={12}
                className={`transition-colors duration-300 ${isVisible ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`}
            />

            {isVisible && (
                <div
                    className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 p-4 bg-slate-950/90 border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl animate-in fade-in zoom-in duration-200 pointer-events-none"
                    style={{ filter: 'drop-shadow(0 0 10px rgba(79, 70, 229, 0.1))' }}
                >
                    <div className="relative">
                        <p className="text-[10px] font-bold leading-relaxed text-slate-200 italic">
                            {content}
                        </p>
                    </div>
                    {/* Triangle pointer */}
                    <div className="absolute top-[calc(100%+0px)] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-slate-900/90" />
                </div>
            )}
        </div>
    );
};
