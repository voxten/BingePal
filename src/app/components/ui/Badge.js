"use client";

import { FiX } from 'react-icons/fi';

// Two visual versions:
//  - soft:    tinted chip for light/dark surfaces
//  - overlay: dark translucent chip for use on top of posters and stills
const SOFT_TONES = {
    neutral: 'bg-slate-100 text-slate-700 ring-slate-500/15 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-400/15',
    accent: 'bg-indigo-50 text-indigo-700 ring-indigo-600/15 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-400/20',
    success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/20',
    warning: 'bg-amber-50 text-amber-800 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/20',
    danger: 'bg-rose-50 text-rose-700 ring-rose-600/15 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/20',
};

const OVERLAY_ICON_TONES = {
    neutral: 'text-white/70',
    accent: 'text-indigo-300',
    success: 'text-emerald-400',
    warning: 'text-amber-400',
    danger: 'text-rose-400',
};

const DOT_TONES = {
    neutral: 'bg-slate-400',
    accent: 'bg-indigo-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
};

const SIZES = {
    sm: 'h-5 px-1.5 gap-1 text-[11px]',
    md: 'h-6 px-2 gap-1.5 text-xs',
};

export default function Badge({
    children,
    variant = 'soft',
    tone = 'neutral',
    size = 'sm',
    icon: Icon,
    iconClassName = '',
    dot,
    onRemove,
    href,
    title,
    className = '',
}) {
    const isOverlay = variant === 'overlay';
    const toneClasses = isOverlay
        ? 'bg-black/55 text-white ring-white/15 backdrop-blur-md'
        : SOFT_TONES[tone] || SOFT_TONES.neutral;
    const iconTone = isOverlay ? OVERLAY_ICON_TONES[tone] || OVERLAY_ICON_TONES.neutral : '';
    const dotColor = typeof dot === 'string' ? dot : DOT_TONES[tone] || DOT_TONES.neutral;
    const iconSize = size === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3';

    const classes = `inline-flex items-center min-w-0 whitespace-nowrap rounded-md font-medium ring-1 ring-inset tabular-nums ${SIZES[size] || SIZES.sm} ${toneClasses} ${className}`;

    const content = (
        <>
            {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />}
            {Icon && <Icon className={`${iconSize} shrink-0 ${iconTone} ${iconClassName}`} />}
            {children != null && <span className="truncate">{children}</span>}
            {onRemove && (
                <button
                    type="button"
                    onClick={onRemove}
                    className="-mr-0.5 ml-0.5 rounded p-0.5 opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
                    aria-label="Remove"
                >
                    <FiX className="w-3 h-3" />
                </button>
            )}
        </>
    );

    if (href) {
        return (
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                title={title}
                className={`${classes} hover:brightness-110 transition`}
            >
                {content}
            </a>
        );
    }

    return (
        <span className={classes} title={title}>
            {content}
        </span>
    );
}
