"use client";

import { FiSquare, FiGrid } from 'react-icons/fi';

export default function LayoutSwitcher({ cardLayout, setCardLayout, className = '' }) {
    return (
        <div className={`flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-sm h-[42px] ${className}`}>
            <button
                type="button"
                onClick={() => setCardLayout('vertical')}
                className={`px-3 h-full rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    cardLayout === 'vertical'
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 font-bold border border-indigo-200/60 dark:border-indigo-800/60 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title="Poster View (2:3)"
            >
                <FiSquare className="w-3.5 h-3.5" />
                <span>Poster</span>
            </button>
            <button
                type="button"
                onClick={() => setCardLayout('wide')}
                className={`px-3 h-full rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    cardLayout === 'wide'
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 font-bold border border-indigo-200/60 dark:border-indigo-800/60 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title="Wide View (Landscape)"
            >
                <FiGrid className="w-3.5 h-3.5" />
                <span>Wide</span>
            </button>
        </div>
    );
}
