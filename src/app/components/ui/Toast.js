"use client";

import { useEffect } from 'react';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiXCircle, FiX } from 'react-icons/fi';

const TOAST_VARIANTS = {
    success: {
        bg: 'bg-indigo-600 dark:bg-indigo-600 text-white shadow-indigo-500/25',
        icon: FiCheckCircle,
        iconColor: 'text-emerald-300'
    },
    error: {
        bg: 'bg-rose-600 text-white shadow-rose-500/25',
        icon: FiXCircle,
        iconColor: 'text-white'
    },
    warning: {
        bg: 'bg-amber-600 text-white shadow-amber-500/25',
        icon: FiAlertCircle,
        iconColor: 'text-amber-200'
    },
    info: {
        bg: 'bg-slate-900 text-white shadow-slate-900/25 dark:bg-slate-800 dark:border dark:border-slate-700',
        icon: FiInfo,
        iconColor: 'text-indigo-400'
    }
};

export default function Toast({
    message,
    variant = 'success',
    duration = 4000,
    onClose
}) {
    useEffect(() => {
        if (!message || !duration || !onClose) return;
        const timer = setTimeout(() => {
            onClose();
        }, duration);
        return () => clearTimeout(timer);
    }, [message, duration, onClose]);

    if (!message) return null;

    const variantConfig = TOAST_VARIANTS[variant] || TOAST_VARIANTS.success;
    const Icon = variantConfig.icon;

    return (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 fade-in duration-200 pointer-events-auto">
            <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl font-semibold text-sm ${variantConfig.bg}`}>
                <Icon className={`w-5 h-5 shrink-0 ${variantConfig.iconColor}`} />
                <span className="leading-snug">{message}</span>
                {onClose && (
                    <button
                        type="button"
                        onClick={onClose}
                        className="ml-2 p-0.5 rounded-lg hover:bg-white/20 transition-colors text-white/80 hover:text-white cursor-pointer"
                        aria-label="Dismiss notification"
                    >
                        <FiX className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
}
