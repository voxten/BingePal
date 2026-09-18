"use client";

import { FiUser } from 'react-icons/fi';

const SIZES = {
    // pad = visible ring + white gap; gap is drawn inside the padding
    sm: { box: 'w-8 h-8', pad: 'p-[3px]', gap: 'ring-1', text: 'text-xs', icon: 'w-4 h-4', glow: '-inset-0.5 blur-[3px]' },
    md: { box: 'w-10 h-10', pad: 'p-[3px]', gap: 'ring-1', text: 'text-sm', icon: 'w-4 h-4', glow: '-inset-1 blur-sm' },
    lg: { box: 'w-24 h-24', pad: 'p-[5px]', gap: 'ring-2', text: 'text-3xl', icon: 'w-9 h-9', glow: '-inset-2 blur-lg' },
};

/**
 * Avatar framed by the viewer tier ring. Higher tiers add a glow, rotating conic rings
 * and (for the top tier) a pulsing halo. Without a tier it renders a plain avatar.
 */
export default function TierAvatar({ photoURL, name, label, tier, level, size = 'md', showLevel = false, className = '' }) {
    const s = SIZES[size] || SIZES.md;
    const initial = name ? name.trim()[0]?.toUpperCase() : '';

    return (
        <div className={`relative inline-flex shrink-0 rounded-full ${s.box} ${className}`}>
            {tier?.glow && (
                <div aria-hidden className={`absolute ${s.glow} rounded-full ${tier.pulse ? 'animate-glow-pulse' : 'opacity-50'}`}>
                    <div className={`w-full h-full rounded-full ${tier.ring} ${tier.animated ? 'animate-spin-slow' : ''}`} />
                </div>
            )}

            <div className={`relative w-full h-full rounded-full overflow-hidden ${tier ? s.pad : ''}`}>
                {tier && (
                    <div aria-hidden className={`absolute inset-0 ${tier.ring} ${tier.animated ? 'animate-spin-slow' : ''}`} />
                )}

                <div className={`relative w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 ${tier ? `${s.gap} ring-white dark:ring-slate-900` : ''}`}>
                    {photoURL ? (
                        <img src={photoURL} alt={name || ''} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : label != null ? (
                        <span className="text-xs font-semibold tabular-nums">{label}</span>
                    ) : initial ? (
                        <span className={`font-semibold ${s.text}`}>{initial}</span>
                    ) : (
                        <FiUser className={s.icon} />
                    )}
                </div>
            </div>

            {showLevel && level != null && (
                <span className="absolute left-1/2 -bottom-2 -translate-x-1/2 inline-flex items-center h-6 px-2.5 rounded-full bg-slate-900 text-white text-xs font-semibold tabular-nums whitespace-nowrap ring-[3px] ring-white dark:bg-white dark:text-slate-900 dark:ring-slate-900">
                    Lv {level}
                </span>
            )}
        </div>
    );
}
