"use client";

import { FiCheck } from 'react-icons/fi';

export function ChoiceChip({ selected, onClick, children, size = 'md' }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={selected}
            className={`inline-flex items-center gap-1.5 rounded-lg border font-medium whitespace-nowrap transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/60 ${
                size === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-8 px-3 text-xs'
            } ${
                selected
                    ? 'bg-slate-100 text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-white dark:border-slate-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 dark:hover:border-slate-700 dark:hover:text-slate-100'
            }`}
        >
            {selected && <FiCheck className="w-3.5 h-3.5" />}
            {children}
        </button>
    );
}

/** Single choice; clicking the selected chip again clears it. */
export default function ChoiceChips({ options, value, onChange, size = 'md', className = '' }) {
    return (
        <div className={`flex flex-wrap gap-1.5 ${className}`}>
            {options.map((opt) => (
                <ChoiceChip
                    key={opt.value}
                    size={size}
                    selected={value === opt.value}
                    onClick={() => onChange(value === opt.value ? '' : opt.value)}
                >
                    {opt.label}
                </ChoiceChip>
            ))}
        </div>
    );
}
