"use client";

import { FiAlertCircle } from 'react-icons/fi';
import Button from './Button';

const BANNER_TONES = {
    accent: {
        container: 'bg-indigo-50/70 border-indigo-200 dark:bg-indigo-500/5 dark:border-indigo-500/20',
        icon: 'text-indigo-600 dark:text-indigo-400',
    },
    success: {
        container: 'bg-emerald-50/70 border-emerald-200 dark:bg-emerald-500/5 dark:border-emerald-500/20',
        icon: 'text-emerald-600 dark:text-emerald-400',
    },
    warning: {
        container: 'bg-amber-50/70 border-amber-200 dark:bg-amber-500/5 dark:border-amber-500/20',
        icon: 'text-amber-600 dark:text-amber-400',
    },
    danger: {
        container: 'bg-rose-50/70 border-rose-200 dark:bg-rose-500/5 dark:border-rose-500/20',
        icon: 'text-rose-600 dark:text-rose-400',
    }
};

export default function AlertBanner({
    tone = 'accent',
    icon: IconComponent = FiAlertCircle,
    title,
    description,
    actionLabel,
    onAction,
    isLoading = false,
    loadingLabel,
    className = ''
}) {
    const style = BANNER_TONES[tone] || BANNER_TONES.accent;

    return (
        <div className={`p-4 border rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${style.container} ${className}`}>
            <div className="flex items-start gap-3 min-w-0">
                <IconComponent className={`w-5 h-5 mt-px shrink-0 ${style.icon}`} />
                <div className="min-w-0">
                    {title && (
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                            {title}
                        </h4>
                    )}
                    {description && (
                        <div className="text-sm mt-0.5 text-slate-600 dark:text-slate-400">
                            {description}
                        </div>
                    )}
                </div>
            </div>

            {onAction && actionLabel && (
                <Button
                    variant="primary"
                    onClick={onAction}
                    loading={isLoading}
                    className="w-full sm:w-auto"
                >
                    {isLoading ? (loadingLabel || 'Processing…') : actionLabel}
                </Button>
            )}
        </div>
    );
}
