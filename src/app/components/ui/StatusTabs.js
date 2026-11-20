"use client";

import { STATUS_CONFIG } from './StatusBadge';

const TABS = [{ value: '', label: 'All' }, ...Object.entries(STATUS_CONFIG).map(([value, c]) => ({ value, label: c.label, dot: c.dot }))];

/** Underlined tabs with counts. Scrolls sideways on narrow screens. */
export default function StatusTabs({ value, onChange, counts = {}, className = '' }) {
    return (
        <div className={`-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto no-scrollbar ${className}`}>
            <div role="tablist" aria-label="Status" className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 min-w-max">
                {TABS.map((tab) => {
                    const active = tab.value === value;
                    const count = counts[tab.value];
                    return (
                        <button
                            key={tab.value || 'all'}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            onClick={() => onChange(tab.value)}
                            className={`relative -mb-px inline-flex items-center gap-2 h-10 px-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors cursor-pointer focus-visible:outline-none focus-visible:bg-slate-100 dark:focus-visible:bg-slate-800 ${
                                active
                                    ? 'border-accent-500 text-slate-900 dark:text-white'
                                    : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:border-slate-700'
                            }`}
                        >
                            {tab.dot && <span className={`w-1.5 h-1.5 rounded-full ${tab.dot}`} />}
                            {tab.label}
                            {count != null && (
                                <span className={`text-xs tabular-nums ${active ? 'text-slate-500 dark:text-slate-400' : 'text-slate-400 dark:text-slate-500'}`}>
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
