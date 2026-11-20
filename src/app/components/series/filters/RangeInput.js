"use client";

import { FiX } from 'react-icons/fi';
import { isRangeInvalid, isRangeSet } from '../../../hooks/useSeriesFilters';

const digitsOnly = (v) => v.replace(/[^\d]/g, '');

/**
 * Typed min / max in one joined box.
 * value: { min: string, max: string }
 * bounds: { min, max } from the collection, shown as placeholders
 */
export default function RangeInput({ value, onChange, unit, label, bounds, size = 'md', className = '' }) {
    const invalid = isRangeInvalid(value);
    const height = size === 'sm' ? 'h-8 text-xs' : 'h-10 text-sm';

    const field = (key, placeholder) => (
        <label className="flex-1 flex items-center gap-1.5 min-w-0 px-3 cursor-text">
            <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500 select-none">{key}</span>
            <input
                inputMode="numeric"
                value={value[key]}
                onChange={(e) => onChange({ ...value, [key]: digitsOnly(e.target.value) })}
                placeholder={placeholder}
                aria-label={`${label || unit} ${key}`}
                aria-invalid={invalid || undefined}
                className="w-full min-w-0 bg-transparent tabular-nums text-slate-900 placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-600 focus:outline-none"
            />
        </label>
    );

    return (
        <div className={`space-y-2 ${className}`}>
            <div
                className={`flex items-center ${height} rounded-xl border bg-white dark:bg-slate-900 transition-colors focus-within:ring-4 ${
                    invalid
                        ? 'border-rose-400 focus-within:ring-rose-500/15 dark:border-rose-500/70'
                        : 'border-slate-200 focus-within:border-accent-500 focus-within:ring-accent-500/15 dark:border-slate-800 dark:focus-within:border-accent-400'
                }`}
            >
                {field('min', bounds ? String(bounds.min) : '0')}
                <span className="self-stretch w-px bg-slate-200 dark:bg-slate-800" aria-hidden />
                {field('max', bounds ? String(bounds.max) : '∞')}
                {unit && <span className="pr-2 text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">{unit}</span>}
                {isRangeSet(value) && (
                    <button
                        type="button"
                        onClick={() => onChange({ min: '', max: '' })}
                        className="mr-1.5 p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                        aria-label={`Clear ${label || unit}`}
                    >
                        <FiX className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>
            {invalid && <p className="text-xs text-rose-600 dark:text-rose-400">Min can’t be higher than max.</p>}
        </div>
    );
}
