"use client";

import { useState } from 'react';
import { FiStar, FiX } from 'react-icons/fi';
import { ChoiceChip } from '../../ui/ChoiceChips';

const SIZES = {
    sm: { star: 'w-4 h-4', cell: 'h-8 w-8' },
    md: { star: 'w-5 h-5', cell: 'h-9 w-9' },
};

/**
 * One row of five stars that picks a rating range.
 * First click sets one end, second click sets the other (click the same star twice for an exact rating).
 * value: null | { min, max } | 'unrated'
 */
export default function StarRangePicker({ value, onChange, allowUnrated = true, showClear = true, size = 'md', className = '' }) {
    const [anchor, setAnchor] = useState(null); // first star of a range being picked
    const [hover, setHover] = useState(null);
    const s = SIZES[size] || SIZES.md;

    const range = value && value !== 'unrated' ? value : null;

    // What to highlight right now: preview while picking, otherwise the saved range
    let lo = range?.min ?? null;
    let hi = range?.max ?? null;
    if (anchor != null) {
        const other = hover ?? anchor;
        lo = Math.min(anchor, other);
        hi = Math.max(anchor, other);
    } else if (!range && hover != null) {
        lo = hover;
        hi = hover;
    }

    const pick = (star) => {
        if (anchor == null) {
            setAnchor(star);
            onChange({ min: star, max: star });
        } else {
            onChange({ min: Math.min(anchor, star), max: Math.max(anchor, star) });
            setAnchor(null);
        }
    };

    const clear = () => {
        setAnchor(null);
        onChange(null);
    };

    const label = value === 'unrated'
        ? 'Unrated only'
        : lo == null
            ? 'Any rating'
            : lo === hi
                ? `${lo} star${lo > 1 ? 's' : ''}`
                : `${lo}–${hi} stars`;

    return (
        <div className={`space-y-2 ${className}`}>
            <div className="flex items-center gap-2.5">
                <div
                    className="flex items-center"
                    onMouseLeave={() => setHover(null)}
                    role="group"
                    aria-label="Rating range"
                >
                    {[1, 2, 3, 4, 5].map((star) => {
                        const inRange = lo != null && star >= lo && star <= hi;
                        const isStart = star === lo;
                        const isEnd = star === hi;
                        return (
                            <button
                                key={star}
                                type="button"
                                onClick={() => pick(star)}
                                onMouseEnter={() => setHover(star)}
                                aria-label={`${star} star${star > 1 ? 's' : ''}`}
                                aria-pressed={inRange}
                                className={`${s.cell} inline-flex items-center justify-center cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/60 ${
                                    inRange ? 'bg-amber-50 dark:bg-amber-400/10' : ''
                                } ${isStart ? 'rounded-l-lg' : ''} ${isEnd ? 'rounded-r-lg' : ''} ${!inRange ? 'rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800' : ''}`}
                            >
                                <FiStar
                                    className={`${s.star} transition-colors ${
                                        inRange
                                            ? 'text-amber-400 fill-amber-400'
                                            : 'text-slate-300 dark:text-slate-600'
                                    }`}
                                />
                            </button>
                        );
                    })}
                </div>

                <span className="text-sm tabular-nums whitespace-nowrap text-slate-700 dark:text-slate-300">{label}</span>

                {showClear && value && (
                    <button
                        type="button"
                        onClick={clear}
                        className="ml-auto p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                        aria-label="Clear rating"
                    >
                        <FiX className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {anchor != null ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">Click another star to make a range, or the same one for exactly {anchor}★.</p>
            ) : allowUnrated && (
                <ChoiceChip
                    size="sm"
                    selected={value === 'unrated'}
                    onClick={() => { setAnchor(null); onChange(value === 'unrated' ? null : 'unrated'); }}
                >
                    Not rated yet
                </ChoiceChip>
            )}
        </div>
    );
}
