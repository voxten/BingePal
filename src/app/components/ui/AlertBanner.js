"use client";

import { FiRefreshCw, FiAlertCircle } from 'react-icons/fi';

const BANNER_VARIANTS = {
    indigo: {
        container: 'bg-indigo-50 border-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-900/40',
        iconBg: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400',
        title: 'text-indigo-900 dark:text-indigo-200',
        desc: 'text-indigo-700/80 dark:text-indigo-300/80',
        button: 'bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white shadow-indigo-500/15'
    },
    gradient: {
        container: 'bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-indigo-500/30 dark:bg-indigo-950/40',
        iconBg: 'bg-indigo-600 text-white shadow-md',
        title: 'text-slate-800 dark:text-slate-100',
        desc: 'text-slate-600 dark:text-slate-300',
        button: 'bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white shadow-indigo-500/20'
    },
    success: {
        container: 'bg-emerald-500/10 border-emerald-500/30 dark:bg-emerald-950/30',
        iconBg: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400',
        title: 'text-emerald-900 dark:text-emerald-200',
        desc: 'text-emerald-700/90 dark:text-emerald-300/90',
        button: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/15'
    },
    warning: {
        container: 'bg-amber-500/10 border-amber-500/30 dark:bg-amber-950/30',
        iconBg: 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400',
        title: 'text-amber-900 dark:text-amber-200',
        desc: 'text-amber-700/90 dark:text-amber-300/90',
        button: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/15'
    },
    error: {
        container: 'bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-900/40',
        iconBg: 'bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400',
        title: 'text-rose-900 dark:text-rose-200',
        desc: 'text-rose-700/90 dark:text-rose-300/90',
        button: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/15'
    }
};

export default function AlertBanner({
    variant = 'indigo',
    icon: IconComponent = FiAlertCircle,
    title,
    description,
    actionLabel,
    onAction,
    isLoading = false,
    loadingLabel,
    className = ''
}) {
    const style = BANNER_VARIANTS[variant] || BANNER_VARIANTS.indigo;

    return (
        <div className={`p-4 border rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${style.container} ${className}`}>
            <div className="flex items-start gap-3">
                <div className={`p-2 rounded-xl shrink-0 ${style.iconBg}`}>
                    <IconComponent className="w-5 h-5" />
                </div>
                <div>
                    {title && (
                        <h4 className={`font-bold text-sm leading-tight ${style.title}`}>
                            {title}
                        </h4>
                    )}
                    {description && (
                        <div className={`text-xs mt-0.5 leading-normal ${style.desc}`}>
                            {description}
                        </div>
                    )}
                </div>
            </div>

            {onAction && actionLabel && (
                <button
                    type="button"
                    onClick={onAction}
                    disabled={isLoading}
                    className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm shrink-0 cursor-pointer active:scale-98 disabled:pointer-events-none ${style.button}`}
                >
                    {isLoading ? (
                        <>
                            <FiRefreshCw className="w-4 h-4 animate-spin" />
                            <span>{loadingLabel || 'Processing...'}</span>
                        </>
                    ) : (
                        <span>{actionLabel}</span>
                    )}
                </button>
            )}
        </div>
    );
}
