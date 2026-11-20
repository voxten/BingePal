import { useMemo, useState } from 'react';
import { FiSliders } from 'react-icons/fi';
import Button from '../../../app/components/ui/Button';
import Badge from '../../../app/components/ui/Badge';
import SearchInput from '../../../app/components/ui/SearchInput';
import SeriesFilterDrawer from './OldSeriesFilterDrawer';
import { MOCK_SERIES } from '../mockSeries';
import MiniSeriesGrid from '../MiniSeriesGrid';

// Same options and filter shape as SeriesList.js today
const SORT_OPTIONS = [
    { label: 'Title (A-Z)', value: 'title' },
    { label: 'Rating (High to Low)', value: 'rating' },
    { label: 'Progress (%)', value: 'progress' },
    { label: 'Watched Episodes', value: 'watchedEpisodes' },
    { label: 'Total Episodes', value: 'totalEpisodes' },
    { label: 'Seasons', value: 'seasons' },
];

const EMPTY = {
    searchQuery: '', status: '', progressStatus: '',
    seasonsMin: '', seasonsMax: '', episodesMin: '', episodesMax: '', ratingMin: '', ratingMax: '',
};

/** The real SeriesFilterDrawer from the app, for comparison. */
export default function LayoutBefore({ initialOpen = true }) {
    const [filters, setFilters] = useState(EMPTY);
    const [open, setOpen] = useState(initialOpen);
    const [sort, setSort] = useState({ key: 'title', direction: 'asc' });

    const activeCount = [
        filters.status,
        filters.progressStatus,
        filters.seasonsMin || filters.seasonsMax,
        filters.episodesMin || filters.episodesMax,
        filters.ratingMin || filters.ratingMax,
    ].filter(Boolean).length;

    const results = useMemo(() => {
        const n = (v) => parseInt(v);
        return MOCK_SERIES.filter((s) => {
            const pct = Math.round((s.watchedEpisodes / s.totalEpisodes) * 100);
            if (filters.searchQuery && !s.title.toLowerCase().includes(filters.searchQuery.toLowerCase())) return false;
            if (filters.status && s.status !== filters.status) return false;
            if (filters.progressStatus === 'not-started' && s.watchedEpisodes !== 0) return false;
            if (filters.progressStatus === 'in-progress' && (pct <= 0 || pct >= 100)) return false;
            if (filters.progressStatus === 'completed' && pct < 100) return false;
            if (filters.seasonsMin && s.seasons < n(filters.seasonsMin)) return false;
            if (filters.seasonsMax && s.seasons > n(filters.seasonsMax)) return false;
            if (filters.episodesMin && s.watchedEpisodes < n(filters.episodesMin)) return false;
            if (filters.episodesMax && s.watchedEpisodes > n(filters.episodesMax)) return false;
            if (filters.ratingMin && s.rating < n(filters.ratingMin)) return false;
            if (filters.ratingMax && s.rating > n(filters.ratingMax)) return false;
            return true;
        }).sort((a, b) => {
            const dir = sort.direction === 'asc' ? 1 : -1;
            return typeof a[sort.key] === 'string' ? a[sort.key].localeCompare(b[sort.key]) * dir : (a[sort.key] - b[sort.key]) * dir;
        });
    }, [filters, sort]);

    return (
        <div className="mx-auto max-w-7xl p-4 sm:p-8 space-y-4">
            <div className="flex flex-col lg:flex-row gap-3 justify-between items-stretch lg:items-center">
                <SearchInput
                    value={filters.searchQuery}
                    onChange={(e) => setFilters((p) => ({ ...p, searchQuery: e.target.value }))}
                    onClear={() => setFilters((p) => ({ ...p, searchQuery: '' }))}
                    placeholder="Search by title..."
                    className="lg:max-w-md"
                />
                <div className="flex justify-end">
                    <Button icon={FiSliders} pressed={open || activeCount > 0} onClick={() => setOpen(!open)}>
                        <span>Filters</span>
                        {activeCount > 0 && <Badge>{activeCount}</Badge>}
                    </Button>
                </div>
            </div>

            <SeriesFilterDrawer
                isOpen={open}
                onClose={() => setOpen(false)}
                filters={filters}
                onFilterChange={(e) => setFilters((p) => ({ ...p, [e.target.name]: e.target.value }))}
                sortConfig={sort}
                onSortChange={(key) => setSort((p) => ({ ...p, key }))}
                onToggleSortDirection={() => setSort((p) => ({ ...p, direction: p.direction === 'asc' ? 'desc' : 'asc' }))}
                sortOptions={SORT_OPTIONS}
                onReset={() => { setFilters(EMPTY); setSort({ key: 'title', direction: 'asc' }); }}
                activeFiltersCount={activeCount}
                onRemoveFilter={(key, value) => setFilters((p) => ({ ...p, [key]: value }))}
            />

            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                <div>Showing <span className="font-medium text-slate-900 dark:text-slate-100">{results.length}</span> of {MOCK_SERIES.length} series</div>
                <div>Sorted by <span className="font-medium text-slate-700 dark:text-slate-300">{SORT_OPTIONS.find((o) => o.value === sort.key)?.label}</span>, {sort.direction === 'asc' ? 'ascending' : 'descending'}</div>
            </div>

            <MiniSeriesGrid series={results} onReset={() => setFilters(EMPTY)} />
        </div>
    );
}
