"use client";

import Link from 'next/link';
import { FiLoader } from 'react-icons/fi';

const VARIANTS = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400 border border-transparent',
    secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-800 dark:hover:bg-slate-800 dark:hover:border-slate-700',
    ghost: 'text-slate-600 border border-transparent hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100',
    danger: 'text-rose-600 border border-transparent hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10',
    overlay: 'bg-black/55 text-white border border-white/15 backdrop-blur-md hover:bg-black/75',
};

const PRESSED = 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/30 dark:hover:bg-indigo-500/15';

const SIZES = {
    sm: 'h-8 px-3 gap-1.5 text-xs rounded-lg',
    md: 'h-10 px-4 gap-2 text-sm rounded-xl',
    lg: 'h-12 px-6 gap-2 text-base rounded-xl',
};

const ICON_SIZES = {
    xs: 'h-7 w-7 rounded-lg',
    sm: 'h-8 w-8 rounded-lg',
    md: 'h-10 w-10 rounded-xl',
};

const BASE = 'inline-flex items-center justify-center shrink-0 font-medium whitespace-nowrap transition-colors cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950 disabled:opacity-50 disabled:pointer-events-none';

function renderElement({ href, className, children, ...rest }) {
    if (href) {
        return (
            <Link href={href} className={className} {...rest}>
                {children}
            </Link>
        );
    }
    return (
        <button type="button" className={className} {...rest}>
            {children}
        </button>
    );
}

export default function Button({
    children,
    variant = 'secondary',
    size = 'md',
    icon: Icon,
    iconRight: IconRight,
    loading = false,
    pressed,
    fullWidth = false,
    className = '',
    disabled,
    ...rest
}) {
    const variantClasses = pressed ? PRESSED : VARIANTS[variant] || VARIANTS.secondary;
    const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';

    return renderElement({
        ...rest,
        disabled: disabled || loading,
        'aria-pressed': pressed === undefined ? undefined : pressed,
        className: `${BASE} ${SIZES[size] || SIZES.md} ${variantClasses} ${fullWidth ? 'w-full' : ''} ${className}`,
        children: (
            <>
                {loading ? (
                    <FiLoader className={`${iconSize} animate-spin`} />
                ) : (
                    Icon && <Icon className={iconSize} />
                )}
                {children}
                {IconRight && <IconRight className={iconSize} />}
            </>
        ),
    });
}

export function IconButton({
    icon: Icon,
    label,
    variant = 'ghost',
    size = 'md',
    pressed,
    className = '',
    iconClassName = '',
    ...rest
}) {
    const variantClasses = pressed ? PRESSED : VARIANTS[variant] || VARIANTS.ghost;
    const iconSize = size === 'md' ? 'w-[18px] h-[18px]' : size === 'sm' ? 'w-4 h-4' : 'w-3.5 h-3.5';

    return renderElement({
        ...rest,
        'aria-label': label,
        title: rest.title ?? label,
        'aria-pressed': pressed === undefined ? undefined : pressed,
        className: `${BASE} ${ICON_SIZES[size] || ICON_SIZES.md} ${variantClasses} ${className}`,
        children: <Icon className={`${iconSize} ${iconClassName}`} />,
    });
}
