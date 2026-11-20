import LayoutBefore from './legacy/LayoutBefore';
import CollectionFilters from './CollectionFilters';

export default {
    title: 'Filters/Collection',
};

const phone = { viewport: { value: 'phone', isRotated: false } };
const someFilters = { filters: { rating: { min: 4, max: 5 }, seasons: { min: '2', max: '' } } };

export const Before = {
    name: 'Before (old panel)',
    render: () => <LayoutBefore />,
};

export const Default = {
    name: 'Toolbar',
    render: () => <CollectionFilters />,
};

export const Open = {
    name: 'Filters open',
    render: () => <CollectionFilters defaultOpen />,
};

export const WithFilters = {
    name: 'Filters applied',
    render: () => <CollectionFilters initial={someFilters} />,
};

export const Phone = {
    name: 'Phone · filters open',
    globals: phone,
    render: () => <CollectionFilters initial={someFilters} defaultOpen />,
};
