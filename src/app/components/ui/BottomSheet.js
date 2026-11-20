"use client";

import { useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import { IconButton } from './Button';

/** Panel that slides up from the bottom of the screen (phone version of a popover). */
export default function BottomSheet({ open, onClose, title, footer, children }) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => e.key === 'Escape' && onClose();
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', onKey);
        return () => {
            document.body.style.overflow = prevOverflow;
            document.removeEventListener('keydown', onKey);
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
            <div className="absolute inset-0 bg-slate-950/40 animate-fade-in" onClick={onClose} />
            <div className="absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col rounded-t-2xl border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 animate-sheet-in">
                <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-slate-200 dark:bg-slate-700" />
                <div className="flex items-center justify-between px-4 pt-2 pb-3">
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h2>
                    <IconButton icon={FiX} label="Close" size="sm" onClick={onClose} />
                </div>
                <div className="flex-1 overflow-y-auto px-4 pb-4">{children}</div>
                {footer && <div className="border-t border-slate-200 px-4 py-3 dark:border-slate-800">{footer}</div>}
            </div>
        </div>
    );
}
