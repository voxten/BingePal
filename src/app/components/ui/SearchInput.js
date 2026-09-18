"use client";

import { FiSearch, FiX, FiLoader } from 'react-icons/fi';
import { CONTROL_BASE } from './Field';

export default function SearchInput({
    value = '',
    onChange,
    onClear,
    placeholder = 'Search...',
    isLoading = false,
    inputRef,
    className = '',
    onKeyDown
}) {
    return (
        <div className={`relative flex-grow group ${className}`}>
            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={onChange}
                onKeyDown={onKeyDown}
                placeholder={placeholder}
                className={`${CONTROL_BASE} h-10 rounded-xl pl-10 pr-16 text-sm`}
            />
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" />

            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {isLoading && (
                    <FiLoader className="w-4 h-4 text-slate-400 animate-spin" />
                )}
                {value && (
                    <button
                        type="button"
                        onClick={onClear}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                        aria-label="Clear search"
                    >
                        <FiX className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>
        </div>
    );
}
