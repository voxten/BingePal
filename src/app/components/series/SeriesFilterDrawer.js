"use client";

import {
    FiX,
    FiRotateCcw,
    FiArrowUp,
    FiArrowDown,
    FiStar
} from 'react-icons/fi';
import { STATUS_CONFIG, STATUS_OPTIONS } from '../ui/StatusBadge';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button, { IconButton } from '../ui/Button';
import { Field, Input, Select } from '../ui/Field';

const PROGRESS_LABELS = {
    'not-started': 'Not started',
    'in-progress': 'In progress',
    'completed': 'Finished'
};

function StarPicker({ label, value, onPick }) {
    const current = value ? parseInt(value) : 0;
    return (
        <div className="flex items-center justify-between h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
            <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => onPick(current === star ? '' : star.toString())}
                        className="p-0.5 rounded transition-transform hover:scale-110 cursor-pointer"
                        aria-label={`${label} ${star} stars`}
                    >
                        <FiStar className={`w-3.5 h-3.5 ${star <= current ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-600'}`} />
                    </button>
                ))}
            </div>
        </div>
    );
}

export default function SeriesFilterDrawer({
    isOpen,
    onClose,
    filters,
    onFilterChange,
    sortConfig,
    onSortChange,
    onToggleSortDirection,
    sortOptions = [],
    onReset,
    activeFiltersCount = 0,
    onRemoveFilter
}) {
    if (!isOpen && activeFiltersCount === 0) return null;

    const removeFilter = (...keys) => keys.forEach(key => onRemoveFilter && onRemoveFilter(key, ''));

    return (
        <div className="space-y-4">
            {isOpen && (
                <Card className="animate-pop-in">
                    <div className="flex justify-between items-center mb-5">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Filter and sort</h3>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" icon={FiRotateCcw} onClick={onReset}>
                                Reset
                            </Button>
                            <IconButton icon={FiX} label="Close filters" size="sm" onClick={onClose} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                        {sortConfig && (
                            <Field label="Sort by">
                                <div className="flex items-center gap-2">
                                    <Select
                                        value={sortConfig.key}
                                        onChange={(e) => onSortChange && onSortChange(e.target.value)}
                                        className="flex-1"
                                    >
                                        {sortOptions.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </Select>
                                    <IconButton
                                        icon={sortConfig.direction === 'asc' ? FiArrowUp : FiArrowDown}
                                        label={sortConfig.direction === 'asc' ? 'Ascending' : 'Descending'}
                                        variant="secondary"
                                        onClick={onToggleSortDirection}
                                    />
                                </div>
                            </Field>
                        )}

                        <Field label="Status">
                            <Select name="status" value={filters.status} onChange={onFilterChange}>
                                <option value="">All statuses</option>
                                {STATUS_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </Select>
                        </Field>

                        <Field label="Progress">
                            <Select name="progressStatus" value={filters.progressStatus} onChange={onFilterChange}>
                                <option value="">Any progress</option>
                                <option value="not-started">Not started (0%)</option>
                                <option value="in-progress">In progress (1–99%)</option>
                                <option value="completed">Finished (100%)</option>
                            </Select>
                        </Field>

                        <Field label="Seasons">
                            <div className="flex items-center gap-1.5">
                                <Input type="number" name="seasonsMin" value={filters.seasonsMin} onChange={onFilterChange} min="0" placeholder="Min" />
                                <span className="text-slate-400 text-xs">–</span>
                                <Input type="number" name="seasonsMax" value={filters.seasonsMax} onChange={onFilterChange} min="0" placeholder="Max" />
                            </div>
                        </Field>

                        <Field label="Watched episodes">
                            <div className="flex items-center gap-1.5">
                                <Input type="number" name="episodesMin" value={filters.episodesMin} onChange={onFilterChange} min="0" placeholder="Min" />
                                <span className="text-slate-400 text-xs">–</span>
                                <Input type="number" name="episodesMax" value={filters.episodesMax} onChange={onFilterChange} min="0" placeholder="Max" />
                            </div>
                        </Field>

                        <Field label="Rating" className="sm:col-span-2 lg:col-span-3 xl:col-span-1">
                            <div className="space-y-1.5">
                                <StarPicker
                                    label="Min"
                                    value={filters.ratingMin}
                                    onPick={(v) => onRemoveFilter && onRemoveFilter('ratingMin', v)}
                                />
                                <StarPicker
                                    label="Max"
                                    value={filters.ratingMax}
                                    onPick={(v) => onRemoveFilter && onRemoveFilter('ratingMax', v)}
                                />
                            </div>
                        </Field>
                    </div>
                </Card>
            )}

            {activeFiltersCount > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Active filters</span>

                    {filters.status && (
                        <Badge size="md" tone="accent" onRemove={() => removeFilter('status')}>
                            Status: {STATUS_CONFIG[filters.status]?.label || filters.status}
                        </Badge>
                    )}

                    {filters.progressStatus && (
                        <Badge size="md" tone="accent" onRemove={() => removeFilter('progressStatus')}>
                            Progress: {PROGRESS_LABELS[filters.progressStatus] || filters.progressStatus}
                        </Badge>
                    )}

                    {(filters.seasonsMin || filters.seasonsMax) && (
                        <Badge size="md" tone="accent" onRemove={() => removeFilter('seasonsMin', 'seasonsMax')}>
                            Seasons: {filters.seasonsMin || '0'}–{filters.seasonsMax || '∞'}
                        </Badge>
                    )}

                    {(filters.episodesMin || filters.episodesMax) && (
                        <Badge size="md" tone="accent" onRemove={() => removeFilter('episodesMin', 'episodesMax')}>
                            Episodes: {filters.episodesMin || '0'}–{filters.episodesMax || '∞'}
                        </Badge>
                    )}

                    {(filters.ratingMin || filters.ratingMax) && (
                        <Badge size="md" tone="accent" onRemove={() => removeFilter('ratingMin', 'ratingMax')}>
                            Rating: {filters.ratingMin || '1'}–{filters.ratingMax || '5'}★
                        </Badge>
                    )}

                    <Button variant="ghost" size="sm" onClick={onReset}>
                        Clear all
                    </Button>
                </div>
            )}
        </div>
    );
}
