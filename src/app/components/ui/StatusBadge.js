"use client";

import {
    FiClock,
    FiPlay,
    FiCheckCircle,
    FiPauseCircle,
    FiXCircle,
    FiHelpCircle
} from 'react-icons/fi';
import Badge from './Badge';

export const STATUS_CONFIG = {
    'plan-to-watch': {
        label: 'Plan to Watch',
        icon: FiClock,
        tone: 'neutral',
        dot: 'bg-slate-400',
        bar: 'bg-slate-400 dark:bg-slate-500',
    },
    'watching': {
        label: 'Watching',
        icon: FiPlay,
        tone: 'accent',
        dot: 'bg-indigo-500',
        bar: 'bg-indigo-500',
    },
    'completed': {
        label: 'Completed',
        icon: FiCheckCircle,
        tone: 'success',
        dot: 'bg-emerald-500',
        bar: 'bg-emerald-500',
    },
    'on-hold': {
        label: 'On Hold',
        icon: FiPauseCircle,
        tone: 'warning',
        dot: 'bg-amber-500',
        bar: 'bg-amber-500',
    },
    'dropped': {
        label: 'Dropped',
        icon: FiXCircle,
        tone: 'danger',
        dot: 'bg-rose-500',
        bar: 'bg-rose-500',
    }
};

export const STATUS_OPTIONS = Object.entries(STATUS_CONFIG).map(([value, conf]) => ({
    value,
    label: conf.label,
    icon: conf.icon
}));

// variant: 'floating' (on posters) | 'subtle' (on surfaces)
export default function StatusBadge({ status, variant = 'floating', size = 'sm', className = '' }) {
    const config = STATUS_CONFIG[status] || {
        label: status || 'Unknown',
        icon: FiHelpCircle,
        tone: 'neutral',
    };

    return (
        <Badge
            variant={variant === 'floating' ? 'overlay' : 'soft'}
            tone={config.tone}
            size={size}
            icon={config.icon}
            title={`Status: ${config.label}`}
            className={className}
        >
            {config.label}
        </Badge>
    );
}
