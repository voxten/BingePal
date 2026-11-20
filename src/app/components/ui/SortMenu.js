"use client";

import { useState } from 'react';
import { FiArrowDown, FiArrowUp, FiCheck, FiChevronDown } from 'react-icons/fi';
import Button, { IconButton } from './Button';
import Popover from './Popover';

/** "Sort: Rating" menu + a separate direction toggle. Labels carry no direction. */
export default function SortMenu({ options, value, onChange, compact = false }) {
    const [open, setOpen] = useState(false);
    const current = options.find((o) => o.value === value.key);
    const asc = value.direction === 'asc';

    return (
        <div className="flex items-center">
            <Popover
                open={open}
                onClose={() => setOpen(false)}
                align="end"
                width="w-56"
                trigger={
                    <Button
                        iconRight={FiChevronDown}
                        onClick={() => setOpen((o) => !o)}
                        aria-haspopup="listbox"
                        aria-expanded={open}
                        className="rounded-r-none"
                    >
                        {!compact && <span className="hidden sm:inline text-slate-500 dark:text-slate-400 font-normal">Sort:</span>}
                        {current?.label}
                    </Button>
                }
            >
                <ul role="listbox" aria-label="Sort by" className="p-1.5">
                    {options.map((opt) => {
                        const selected = opt.value === value.key;
                        return (
                            <li key={opt.value}>
                                <button
                                    type="button"
                                    role="option"
                                    aria-selected={selected}
                                    onClick={() => { onChange({ ...value, key: opt.value }); setOpen(false); }}
                                    className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 h-9 text-sm cursor-pointer transition-colors ${
                                        selected
                                            ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white'
                                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-white'
                                    }`}
                                >
                                    {opt.label}
                                    {selected && <FiCheck className="w-4 h-4" />}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </Popover>
            <IconButton
                icon={asc ? FiArrowUp : FiArrowDown}
                label={asc ? 'Ascending — click for descending' : 'Descending — click for ascending'}
                variant="secondary"
                onClick={() => onChange({ ...value, direction: asc ? 'desc' : 'asc' })}
                className="-ml-px rounded-l-none"
            />
        </div>
    );
}
