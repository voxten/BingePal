"use client";

import { useEffect, useRef } from 'react';
import { FiX } from 'react-icons/fi';
import { IconButton } from './Button';

const SIZES = {
    sm: 'sm:max-w-md',
    md: 'sm:max-w-lg',
    lg: 'sm:max-w-2xl',
    xl: 'sm:max-w-5xl',
};

export default function Modal({
    isOpen = true,
    onClose,
    title,
    description,
    size = 'md',
    headerStart,
    headerActions,
    headerBottom,
    footer,
    bodyClassName = 'p-5',
    scrollBody = true,
    panelClassName = '',
    children,
}) {
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && onCloseRef.current) onCloseRef.current();
        };
        const previousOverflow = document.body.style.overflow;

        document.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = previousOverflow;
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
            <div
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
                aria-hidden="true"
            />

            <div
                role="dialog"
                aria-modal="true"
                className={`relative flex w-full flex-col max-h-[92vh] sm:max-h-[88vh] ${SIZES[size] || SIZES.md} bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-2xl sm:rounded-2xl shadow-xl animate-sheet-in sm:animate-pop-in ${panelClassName}`}
            >
                {(title || headerActions || headerStart) && (
                    <div className="shrink-0 border-b border-slate-200 dark:border-slate-800 px-5 py-4">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex min-w-0 items-start gap-3">
                                {headerStart}
                                <div className="min-w-0">
                                    <div className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">
                                        {title}
                                    </div>
                                    {description && (
                                        <div className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                                            {description}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-1 -mr-1.5 -mt-1">
                                {headerActions}
                                {onClose && (
                                    <IconButton icon={FiX} label="Close" size="sm" onClick={onClose} />
                                )}
                            </div>
                        </div>
                        {headerBottom && <div className="mt-3">{headerBottom}</div>}
                    </div>
                )}

                <div className={`flex-1 min-h-0 ${scrollBody ? 'overflow-y-auto' : 'overflow-hidden'} ${bodyClassName}`}>
                    {children}
                </div>

                {footer && (
                    <div className="shrink-0 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-5 py-3.5 rounded-b-2xl">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
