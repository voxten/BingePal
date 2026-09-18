"use client";

import { FiChevronDown } from 'react-icons/fi';

const CONTROL_SIZES = {
    sm: 'h-8 rounded-lg px-2.5 text-xs',
    md: 'h-10 rounded-xl px-3 text-sm',
};

export const CONTROL_BASE = 'w-full border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-400';

export function Field({ label, hint, error, htmlFor, className = '', children }) {
    return (
        <div className={`space-y-1.5 ${className}`}>
            {label && (
                <label htmlFor={htmlFor} className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                    {label}
                </label>
            )}
            {children}
            {hint && !error && <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
            {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}
        </div>
    );
}

export function Input({ size = 'md', className = '', ...rest }) {
    return (
        <input
            className={`${CONTROL_BASE} ${CONTROL_SIZES[size] || CONTROL_SIZES.md} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${className}`}
            {...rest}
        />
    );
}

export function Select({ size = 'md', className = '', children, ...rest }) {
    return (
        <div className={`relative ${className}`}>
            <select
                className={`${CONTROL_BASE} ${CONTROL_SIZES[size] || CONTROL_SIZES.md} appearance-none pr-8 font-medium cursor-pointer`}
                {...rest}
            >
                {children}
            </select>
            <FiChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        </div>
    );
}
