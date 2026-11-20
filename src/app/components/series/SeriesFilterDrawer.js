"use client";

import { useState } from 'react';
import { FiSliders } from 'react-icons/fi';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Popover from '../ui/Popover';
import BottomSheet from '../ui/BottomSheet';
import FilterSections from './filters/FilterSections';
import useMediaQuery from '../../hooks/useMediaQuery';

function PanelFooter({ state, onDone }) {
    return (
        <div className="flex items-center justify-between gap-2">
            <Button variant="ghost" size="sm" onClick={state.clearPanelFilters} disabled={state.activeCount === 0}>
                Clear all
            </Button>
            <Button variant="primary" size="sm" onClick={onDone}>
                Show {state.results.length} series
            </Button>
        </div>
    );
}

/**
 * "Filters" button with its panel: a popover under the button on wider screens,
 * a bottom sheet on phones. `state` comes from useSeriesFilters.
 */
export default function SeriesFilterDrawer({ state, defaultOpen = false }) {
    const [open, setOpen] = useState(defaultOpen);
    const isDesktop = useMediaQuery('(min-width: 640px)');
    const close = () => setOpen(false);

    const button = (
        <Button icon={FiSliders} pressed={open} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
            Filters
            {state.activeCount > 0 && <Badge tone="accent">{state.activeCount}</Badge>}
        </Button>
    );

    if (!isDesktop) {
        return (
            <>
                {button}
                <BottomSheet open={open} onClose={close} title="Filters" footer={<PanelFooter state={state} onDone={close} />}>
                    <FilterSections state={state} />
                </BottomSheet>
            </>
        );
    }

    return (
        <Popover open={open} onClose={close} align="end" width="w-[22rem]" label="Filters" trigger={button}>
            <div className="flex items-center px-5 h-12 border-b border-slate-200 dark:border-slate-800">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Filters</h2>
            </div>
            <div className="px-5 py-5 max-h-[60vh] overflow-y-auto">
                <FilterSections state={state} />
            </div>
            <div className="border-t border-slate-200 dark:border-slate-800 px-5 py-3">
                <PanelFooter state={state} onDone={close} />
            </div>
        </Popover>
    );
}
