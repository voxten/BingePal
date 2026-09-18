"use client";

const SIZES = {
    sm: { track: 'h-8 p-0.5 rounded-lg', item: 'px-2.5 text-xs rounded-md gap-1.5', icon: 'w-3.5 h-3.5' },
    md: { track: 'h-10 p-1 rounded-xl', item: 'px-3 text-xs rounded-lg gap-1.5', icon: 'w-3.5 h-3.5' },
};

export default function SegmentedControl({
    options = [],
    value,
    onChange,
    size = 'md',
    fullWidth = false,
    disabled = false,
    className = '',
    'aria-label': ariaLabel,
}) {
    const s = SIZES[size] || SIZES.md;

    return (
        <div
            role="radiogroup"
            aria-label={ariaLabel}
            className={`${fullWidth ? 'flex w-full' : 'inline-flex'} items-stretch shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 ${s.track} ${className}`}
        >
            {options.map((opt) => {
                const isActive = opt.value === value;
                const Icon = opt.icon;
                return (
                    <button
                        key={opt.value}
                        type="button"
                        role="radio"
                        aria-checked={isActive}
                        disabled={disabled}
                        title={opt.title}
                        onClick={() => onChange && onChange(opt.value)}
                        className={`${fullWidth ? 'flex-1' : ''} inline-flex items-center justify-center font-medium whitespace-nowrap transition-colors cursor-pointer disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 ${s.item} ${
                            isActive
                                ? 'bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-600/15 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-400/20'
                                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                        }`}
                    >
                        {Icon && <Icon className={s.icon} />}
                        {opt.label && <span>{opt.label}</span>}
                    </button>
                );
            })}
        </div>
    );
}
