import SearchInput from '../../app/components/ui/SearchInput';
import SortMenu from '../../app/components/ui/SortMenu';
import StatusTabs from '../../app/components/ui/StatusTabs';
import SeriesFilterDrawer from '../../app/components/series/SeriesFilterDrawer';
import ActiveFiltersBar from '../../app/components/series/filters/ActiveFiltersBar';
import useSeriesFilters, { SORT_OPTIONS } from '../../app/hooks/useSeriesFilters';
import { MOCK_SERIES } from './mockSeries';
import MiniSeriesGrid from './MiniSeriesGrid';

/**
 * The My Collection toolbar built from the real components, on made-up data.
 * (SeriesList itself needs Firebase, so it can't run in Storybook.)
 */
export default function CollectionFilters({ initial, defaultOpen = false }) {
    const state = useSeriesFilters(MOCK_SERIES, initial);
    const { filters, set } = state;

    return (
        <div className="mx-auto max-w-7xl p-4 sm:p-8 space-y-4">
            <div className="flex flex-col lg:flex-row gap-3 justify-between items-stretch lg:items-center">
                <SearchInput
                    value={filters.query}
                    onChange={(e) => set('query', e.target.value)}
                    onClear={() => set('query', '')}
                    placeholder="Search by title..."
                    className="lg:max-w-md"
                />
                <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center justify-end">
                    <SortMenu options={SORT_OPTIONS} value={state.sort} onChange={state.setSort} />
                    <SeriesFilterDrawer state={state} defaultOpen={defaultOpen} />
                </div>
            </div>

            <StatusTabs value={filters.status} onChange={(v) => set('status', v)} counts={state.statusCounts} />
            <ActiveFiltersBar state={state} />
            <MiniSeriesGrid series={state.results} onReset={state.resetAll} />
        </div>
    );
}
