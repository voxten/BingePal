"use client";

import { useEffect, useRef } from 'react';

/** Panel anchored under its trigger. Closes on Esc and on a click outside. */
export default function Popover({ open, onClose, trigger, align = 'start', width = 'w-80', label, children }) {
    const ref = useRef(null);

    useEffect(() => {
        if (!open) return;
        const onKey = (e) => e.key === 'Escape' && onClose();
        const onDown = (e) => ref.current && !ref.current.contains(e.target) && onClose();
        document.addEventListener('keydown', onKey);
        document.addEventListener('mousedown', onDown);
        return () => {
            document.removeEventListener('keydown', onKey);
            document.removeEventListener('mousedown', onDown);
        };
    }, [open, onClose]);

    return (
        <div ref={ref} className="relative">
            {trigger}
            {open && (
                <div
                    role="dialog"
                    aria-label={label}
                    className={`absolute z-30 mt-2 ${align === 'end' ? 'right-0' : 'left-0'} ${width} max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/40 animate-pop-in`}
                >
                    {children}
                </div>
            )}
        </div>
    );
}
