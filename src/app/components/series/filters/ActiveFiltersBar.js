"use client";

import Badge from '../../ui/Badge';

/** One line under the toolbar: result count, active panel filters, clear all. */
export default function ActiveFiltersBar({ state }) {
    const { results, total, chips, clearPanelFilters } = state;

    return (
        <div className="flex flex-wrap items-center gap-2 min-h-6 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            <span>
                <span className="font-medium text-slate-900 dark:text-slate-100">{results.length}</span> of {total} series
            </span>
            {chips.length > 0 && (
                <>
                    <span className="h-3.5 w-px bg-slate-200 dark:bg-slate-800" aria-hidden />
                    {chips.map((chip) => (
                        <Badge key={chip.key} size="md" onRemove={chip.clear}>{chip.label}</Badge>
                    ))}
                    <button
                        type="button"
                        onClick={clearPanelFilters}
                        className="px-1 text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer"
                    >
                        Clear all
                    </button>
                </>
            )}
        </div>
    );
}
