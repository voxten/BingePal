"use client";

import { useMemo, useState } from 'react';
import { STATUS_CONFIG } from '../components/ui/StatusBadge';

export const PROGRESS_OPTIONS = [
    { value: 'not-started', label: 'Not started' },
    { value: 'in-progress', label: 'In progress' },
    { value: 'completed', label: 'Finished' },
];

export const SORT_OPTIONS = [
    { value: 'title', label: 'Title' },
    { value: 'rating', label: 'Rating' },
    { value: 'progress', label: 'Progress' },
    { value: 'watchedEpisodes', label: 'Watched episodes' },
    { value: 'totalEpisodes', label: 'Total episodes' },
    { value: 'seasons', label: 'Seasons' },
];

export const EMPTY_RANGE = { min: '', max: '' };

export const EMPTY_FILTERS = {
    query: '',
    status: '',
    progress: '',
    rating: null, // null | { min, max } | 'unrated'
    seasons: EMPTY_RANGE,
    episodes: EMPTY_RANGE,
};

export const DEFAULT_SORT = { key: 'title', direction: 'asc' };

// Real documents can miss fields; read them the same way everywhere
const seasonsOf = (s) => s.seasons || 1;
const watchedOf = (s) => s.watchedEpisodes || 0;
const totalOf = (s) => s.totalEpisodes || 0;
const ratingOf = (s) => s.rating || 0;
const progressOf = (s) => (totalOf(s) > 0 ? watchedOf(s) / totalOf(s) : 0);

const SORT_VALUE = {
    title: (s) => (s.title || '').toLowerCase(),
    rating: ratingOf,
    progress: progressOf,
    watchedEpisodes: watchedOf,
    totalEpisodes: totalOf,
    seasons: seasonsOf,
};

const toNum = (v) => (v === '' || v == null ? null : Number(v));

export function isRangeSet(range) {
    return range.min !== '' || range.max !== '';
}

export function isRangeInvalid(range) {
    const min = toNum(range.min);
    const max = toNum(range.max);
    return min != null && max != null && min > max;
}

function inRange(value, range) {
    if (isRangeInvalid(range)) return true; // a broken range is ignored instead of hiding everything
    const min = toNum(range.min);
    const max = toNum(range.max);
    if (min != null && value < min) return false;
    if (max != null && value > max) return false;
    return true;
}

export function formatRating(rating) {
    if (rating === 'unrated') return 'Not rated';
    if (!rating) return '';
    return rating.min === rating.max ? `${rating.min}★` : `${rating.min}–${rating.max}★`;
}

export function formatRange(range, unit) {
    if (!isRangeSet(range)) return '';
    if (range.min !== '' && range.max !== '') {
        return range.min === range.max ? `${range.min} ${unit}` : `${range.min}–${range.max} ${unit}`;
    }
    if (range.min !== '') return `${range.min}+ ${unit}`;
    return `≤ ${range.max} ${unit}`;
}

function matches(s, f, { skipStatus = false } = {}) {
    const q = f.query.trim().toLowerCase();
    if (q && !(s.title || '').toLowerCase().includes(q)) return false;
    if (!skipStatus && f.status && s.status !== f.status) return false;

    if (f.progress) {
        const p = progressOf(s);
        if (f.progress === 'not-started' && watchedOf(s) !== 0) return false;
        if (f.progress === 'in-progress' && (p <= 0 || p >= 1)) return false;
        if (f.progress === 'completed' && p < 1) return false;
    }

    if (f.rating === 'unrated' && ratingOf(s) !== 0) return false;
    if (f.rating && f.rating !== 'unrated' && (ratingOf(s) < f.rating.min || ratingOf(s) > f.rating.max)) return false;

    if (!inRange(seasonsOf(s), f.seasons)) return false;
    if (!inRange(watchedOf(s), f.episodes)) return false;
    return true;
}

/**
 * Search, status tabs, panel filters and sorting for a list of the user's series.
 * Status and search have their own controls; "panel filters" are progress, rating, seasons, episodes.
 */
export default function useSeriesFilters(series = [], initial = {}) {
    const [filters, setFilters] = useState({ ...EMPTY_FILTERS, ...initial.filters });
    const [sort, setSort] = useState(initial.sort || DEFAULT_SORT);

    const set = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));

    const results = useMemo(() => {
        const valueOf = SORT_VALUE[sort.key] || SORT_VALUE.title;
        const dir = sort.direction === 'asc' ? 1 : -1;
        return series
            .filter((s) => matches(s, filters))
            .sort((a, b) => {
                const av = valueOf(a);
                const bv = valueOf(b);
                return (av > bv ? 1 : av < bv ? -1 : 0) * dir;
            });
    }, [series, filters, sort]);

    // Tab counts respect every other filter, so the numbers match what the tab will show
    const statusCounts = useMemo(() => {
        const base = series.filter((s) => matches(s, filters, { skipStatus: true }));
        const counts = { '': base.length };
        Object.keys(STATUS_CONFIG).forEach((k) => {
            counts[k] = base.filter((s) => s.status === k).length;
        });
        return counts;
    }, [series, filters]);

    // Smallest and largest values in the collection, shown as placeholders in the min/max fields
    const bounds = useMemo(() => {
        if (series.length === 0) return { seasons: null, episodes: null };
        const seasons = series.map(seasonsOf);
        const eps = series.map(watchedOf);
        return {
            seasons: { min: Math.min(...seasons), max: Math.max(...seasons) },
            episodes: { min: Math.min(...eps), max: Math.max(...eps) },
        };
    }, [series]);

    const chips = [];
    if (filters.progress) {
        chips.push({ key: 'progress', label: PROGRESS_OPTIONS.find((o) => o.value === filters.progress)?.label, clear: () => set('progress', '') });
    }
    if (filters.rating) {
        chips.push({ key: 'rating', label: `Rating ${formatRating(filters.rating)}`, clear: () => set('rating', null) });
    }
    if (isRangeSet(filters.seasons) && !isRangeInvalid(filters.seasons)) {
        chips.push({ key: 'seasons', label: formatRange(filters.seasons, 'seasons'), clear: () => set('seasons', EMPTY_RANGE) });
    }
    if (isRangeSet(filters.episodes) && !isRangeInvalid(filters.episodes)) {
        chips.push({ key: 'episodes', label: formatRange(filters.episodes, 'eps watched'), clear: () => set('episodes', EMPTY_RANGE) });
    }

    return {
        filters,
        set,
        sort,
        setSort,
        results,
        total: series.length,
        statusCounts,
        bounds,
        chips,
        activeCount: chips.length,
        clearPanelFilters: () => setFilters((prev) => ({ ...EMPTY_FILTERS, query: prev.query, status: prev.status })),
        resetAll: () => {
            setFilters(EMPTY_FILTERS);
            setSort(DEFAULT_SORT);
        },
    };
}
