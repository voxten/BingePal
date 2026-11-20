"use client";

import ChoiceChips from '../../ui/ChoiceChips';
import StarRangePicker from './StarRangePicker';
import RangeInput from './RangeInput';
import { PROGRESS_OPTIONS } from '../../../hooks/useSeriesFilters';

function Section({ title, onClear, children }) {
    return (
        <section className="space-y-2.5">
            <div className="flex items-center justify-between h-5">
                <h3 className="text-xs font-medium text-slate-600 dark:text-slate-400">{title}</h3>
                {onClear && (
                    <button
                        type="button"
                        onClick={onClear}
                        className="text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer"
                    >
                        Clear
                    </button>
                )}
            </div>
            {children}
        </section>
    );
}

/** Progress, rating, seasons and watched episodes, stacked. `state` comes from useSeriesFilters. */
export default function FilterSections({ state, className = 'space-y-6' }) {
    const { filters, set, bounds } = state;

    return (
        <div className={className}>
            <Section title="Progress" onClear={filters.progress ? () => set('progress', '') : null}>
                <ChoiceChips options={PROGRESS_OPTIONS} value={filters.progress} onChange={(v) => set('progress', v)} />
            </Section>

            <Section title="Your rating" onClear={filters.rating ? () => set('rating', null) : null}>
                <StarRangePicker value={filters.rating} onChange={(v) => set('rating', v)} showClear={false} />
            </Section>

            <Section title="Seasons">
                <RangeInput
                    unit="seasons"
                    label="Seasons"
                    value={filters.seasons}
                    onChange={(v) => set('seasons', v)}
                    bounds={bounds.seasons}
                />
            </Section>

            <Section title="Watched episodes">
                <RangeInput
                    unit="eps"
                    label="Watched episodes"
                    value={filters.episodes}
                    onChange={(v) => set('episodes', v)}
                    bounds={bounds.episodes}
                />
            </Section>
        </div>
    );
}
