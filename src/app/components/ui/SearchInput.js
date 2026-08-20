"use client";

import { FiSearch, FiX, FiLoader } from 'react-icons/fi';

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
                className="w-full pl-10 pr-12 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl transition-all focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 shadow-sm text-sm dark:text-slate-100 placeholder:text-slate-400 font-medium"
            />
            <FiSearch className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" />
            
            <div className="absolute right-3 top-2.5 flex items-center gap-1.5">
                {isLoading && (
                    <FiLoader className="w-4 h-4 text-indigo-500 animate-spin" />
                )}
                {value && (
                    <button 
                        type="button"
                        onClick={onClear}
                        className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                        title="Clear search"
                    >
                        <FiX className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>
        </div>
    );
}
