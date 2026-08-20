"use client";

import { 
    FiClock, 
    FiPlay, 
    FiCheckCircle, 
    FiPauseCircle, 
    FiXCircle,
    FiHelpCircle
} from 'react-icons/fi';

export const STATUS_CONFIG = {
    'plan-to-watch': {
        label: 'Plan to Watch',
        icon: FiClock,
        pillBg: 'bg-slate-500/20 text-slate-300 border-slate-400/30',
        badgeBg: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
        dot: 'bg-slate-400',
    },
    'watching': {
        label: 'Watching',
        icon: FiPlay,
        pillBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30',
        badgeBg: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
        dot: 'bg-indigo-400',
    },
    'completed': {
        label: 'Completed',
        icon: FiCheckCircle,
        pillBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
        badgeBg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
        dot: 'bg-emerald-400',
    },
    'on-hold': {
        label: 'On Hold',
        icon: FiPauseCircle,
        pillBg: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
        badgeBg: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
        dot: 'bg-amber-400',
    },
    'dropped': {
        label: 'Dropped',
        icon: FiXCircle,
        pillBg: 'bg-rose-500/20 text-rose-300 border-rose-400/30',
        badgeBg: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
        dot: 'bg-rose-400',
    }
};

export const STATUS_OPTIONS = Object.entries(STATUS_CONFIG).map(([value, conf]) => ({
    value,
    label: conf.label,
    icon: conf.icon
}));

export default function StatusBadge({ status, variant = 'floating', className = '' }) {
    const config = STATUS_CONFIG[status] || {
        label: status || 'Unknown',
        icon: FiHelpCircle,
        pillBg: 'bg-slate-500/20 text-slate-300 border-slate-400/30',
        badgeBg: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
        dot: 'bg-slate-400',
    };

    const StatusIcon = config.icon;

    if (variant === 'floating') {
        return (
            <div 
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full backdrop-blur-md border shadow-lg ${config.pillBg} ${className}`}
                title={`Status: ${config.label}`}
            >
                <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                <StatusIcon className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[11px] font-bold tracking-wide">
                    {config.label}
                </span>
            </div>
        );
    }

    return (
        <span 
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${config.badgeBg} ${className}`}
        >
            <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
            <StatusIcon className="w-3.5 h-3.5" />
            <span>{config.label}</span>
        </span>
    );
}
