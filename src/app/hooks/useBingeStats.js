"use client";

import { useState, useEffect, useMemo } from 'react';
import { calculateBingeStats, fetchTVMazeShowDetails } from '../services/bingeStatsService';

const getTvmazeIds = (allSeries) => allSeries
    .map(s => {
        const data = typeof s.data === 'function' ? s.data() : s;
        return data.tvmazeId;
    })
    .filter(Boolean);

/**
 * Computes binge stats for a collection, enriching it in the background with
 * TVMaze details (exact runtimes and genres) for up to 40 series.
 */
export default function useBingeStats(allSeries = []) {
    const [enrichedMap, setEnrichedMap] = useState({});
    // The collection the last enrichment pass finished for
    const [enrichedFor, setEnrichedFor] = useState(null);

    const tvmazeIds = useMemo(() => getTvmazeIds(allSeries), [allSeries]);
    const loadingEnrichment = tvmazeIds.length > 0 && enrichedFor !== allSeries;

    useEffect(() => {
        if (tvmazeIds.length === 0) return;

        let isMounted = true;

        Promise.all(tvmazeIds.slice(0, 40).map(async (id) => {
            const details = await fetchTVMazeShowDetails(id);
            return { id: String(id), details };
        })).then((results) => {
            if (!isMounted) return;
            const map = {};
            results.forEach(({ id, details }) => {
                if (details) map[id] = details;
            });
            setEnrichedMap(prev => ({ ...prev, ...map }));
            setEnrichedFor(allSeries);
        }).catch(() => {
            if (isMounted) setEnrichedFor(allSeries);
        });

        return () => { isMounted = false; };
    }, [allSeries, tvmazeIds]);

    const stats = useMemo(() => {
        return calculateBingeStats(allSeries, enrichedMap);
    }, [allSeries, enrichedMap]);

    return { stats, loadingEnrichment };
}
