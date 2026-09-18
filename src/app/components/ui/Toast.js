"use client";

import { useEffect } from 'react';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiXCircle, FiX } from 'react-icons/fi';

const TOAST_VARIANTS = {
    success: { icon: FiCheckCircle, iconColor: 'text-emerald-400' },
    error: { icon: FiXCircle, iconColor: 'text-rose-400' },
    warning: { icon: FiAlertCircle, iconColor: 'text-amber-400' },
    info: { icon: FiInfo, iconColor: 'text-indigo-300' }
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
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:bottom-6 sm:right-6 z-[60] animate-pop-in" role="status">
            <div className="flex items-center gap-3 pl-4 pr-2 py-2.5 rounded-xl shadow-xl bg-slate-900 text-white text-sm ring-1 ring-white/10 dark:bg-slate-800">
                <Icon className={`w-4 h-4 shrink-0 ${variantConfig.iconColor}`} />
                <span className="leading-snug flex-1">{message}</span>
                {onClose && (
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white cursor-pointer"
                        aria-label="Dismiss notification"
                    >
                        <FiX className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
}
