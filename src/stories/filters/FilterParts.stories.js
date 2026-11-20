import { useState } from 'react';
import Card from '../../app/components/ui/Card';
import ChoiceChips from '../../app/components/ui/ChoiceChips';
import SortMenu from '../../app/components/ui/SortMenu';
import StatusTabs from '../../app/components/ui/StatusTabs';
import StarRangePicker from '../../app/components/series/filters/StarRangePicker';
import RangeInput from '../../app/components/series/filters/RangeInput';
import FilterSections from '../../app/components/series/filters/FilterSections';
import useSeriesFilters, { PROGRESS_OPTIONS, SORT_OPTIONS } from '../../app/hooks/useSeriesFilters';
import { MOCK_SERIES } from './mockSeries';

export default {
    title: 'Filters/Parts',
    decorators: [(Story) => <div className="p-8 max-w-xl"><Story /></div>],
};

const Stateful = ({ initial, children }) => {
    const [value, setValue] = useState(initial);
    return children(value, setValue);
};

const Caption = ({ children }) => <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">{children}</p>;

// ---------- Stars ----------

export const StarsEmpty = {
    name: 'Stars · empty',
    render: () => (
        <>
            <Caption>Click one star, then another to pick a range. Click the same star twice for an exact rating.</Caption>
            <Stateful initial={null}>{(v, set) => <StarRangePicker value={v} onChange={set} />}</Stateful>
        </>
    ),
};

export const StarsRange = {
    name: 'Stars · 3–5 range',
    render: () => <Stateful initial={{ min: 3, max: 5 }}>{(v, set) => <StarRangePicker value={v} onChange={set} />}</Stateful>,
};

export const StarsExact = {
    name: 'Stars · exactly 4',
    render: () => <Stateful initial={{ min: 4, max: 4 }}>{(v, set) => <StarRangePicker value={v} onChange={set} />}</Stateful>,
};

export const StarsUnrated = {
    name: 'Stars · not rated yet',
    render: () => <Stateful initial="unrated">{(v, set) => <StarRangePicker value={v} onChange={set} />}</Stateful>,
};

// ---------- Min / max ----------

export const RangeEmpty = {
    name: 'Min/max · empty',
    render: () => (
        <>
            <Caption>Placeholders show the smallest and largest value in the collection.</Caption>
            <Stateful initial={{ min: '', max: '' }}>
                {(v, set) => <RangeInput unit="seasons" label="Seasons" value={v} onChange={set} bounds={{ min: 1, max: 9 }} />}
            </Stateful>
        </>
    ),
};

export const RangeFilled = {
    name: 'Min/max · filled',
    render: () => (
        <Stateful initial={{ min: '2', max: '4' }}>
            {(v, set) => <RangeInput unit="seasons" label="Seasons" value={v} onChange={set} bounds={{ min: 1, max: 9 }} />}
        </Stateful>
    ),
};

export const RangeInvalid = {
    name: 'Min/max · min above max',
    render: () => (
        <Stateful initial={{ min: '5', max: '2' }}>
            {(v, set) => <RangeInput unit="seasons" label="Seasons" value={v} onChange={set} bounds={{ min: 1, max: 9 }} />}
        </Stateful>
    ),
};

export const RangeSmall = {
    name: 'Min/max · small size',
    render: () => (
        <Stateful initial={{ min: '10', max: '' }}>
            {(v, set) => <RangeInput size="sm" unit="eps" label="Watched episodes" value={v} onChange={set} bounds={{ min: 0, max: 88 }} />}
        </Stateful>
    ),
};

// ---------- Other parts ----------

export const ProgressChips = {
    name: 'Progress chips',
    render: () => <Stateful initial="in-progress">{(v, set) => <ChoiceChips options={PROGRESS_OPTIONS} value={v} onChange={set} />}</Stateful>,
};

export const Tabs = {
    name: 'Status tabs',
    decorators: [(Story) => <div className="max-w-3xl"><Story /></div>],
    render: () => (
        <Stateful initial="">
            {(v, set) => (
                <StatusTabs
                    value={v}
                    onChange={set}
                    counts={{ '': 16, 'plan-to-watch': 4, watching: 4, completed: 4, 'on-hold': 2, dropped: 2 }}
                />
            )}
        </Stateful>
    ),
};

export const Sort = {
    name: 'Sort menu',
    decorators: [(Story) => <div className="flex justify-end min-h-80"><Story /></div>],
    render: () => (
        <Stateful initial={{ key: 'rating', direction: 'desc' }}>
            {(v, set) => <SortMenu options={SORT_OPTIONS} value={v} onChange={set} />}
        </Stateful>
    ),
};

function PanelDemo() {
    const state = useSeriesFilters(MOCK_SERIES, { filters: { rating: { min: 4, max: 5 }, seasons: { min: '2', max: '' } } });
    return (
        <Card className="w-[22rem]">
            <FilterSections state={state} />
            <p className="mt-5 text-xs text-slate-500 dark:text-slate-400 tabular-nums">{state.results.length} of {state.total} series match</p>
        </Card>
    );
}

export const Panel = {
    name: 'All filters together',
    render: () => <PanelDemo />,
};
