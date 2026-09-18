/**
 * Service to compute comprehensive Binge Stats for a user's collection
 */

// In-memory cache for TVMaze show metadata (genres, runtime, network, status)
const showDetailsCache = new Map();

export async function fetchTVMazeShowDetails(tvmazeId) {
    if (!tvmazeId) return null;
    const key = String(tvmazeId);
    if (showDetailsCache.has(key)) {
        return showDetailsCache.get(key);
    }
    try {
        const res = await fetch(`https://api.tvmaze.com/shows/${key}?embed=nextepisode`);
        if (!res.ok) return null;
        const data = await res.json();
        showDetailsCache.set(key, data);
        return data;
    } catch (err) {
        console.warn('Failed to fetch TVMaze show details:', err);
        return null;
    }
}

/**
 * Format total minutes into a human-readable duration (days, hours, minutes)
 */
export function formatWatchTime(totalMinutes) {
    if (!totalMinutes || totalMinutes <= 0) {
        return { days: 0, hours: 0, minutes: 0, formatted: '0h 0m' };
    }

    const days = Math.floor(totalMinutes / (24 * 60));
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
    const minutes = Math.floor(totalMinutes % 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0 || days > 0) parts.push(`${hours}h`);
    parts.push(`${minutes}m`);

    return {
        days,
        hours,
        minutes,
        totalMinutes: Math.max(0, totalMinutes || 0),
        formatted: parts.join(' ')
    };
}

/**
 * Calculates all user statistics from their series collection
 */
export function calculateBingeStats(allSeries = [], enrichedDataMap = {}) {
    let totalWatchedEpisodes = 0;
    let totalEpisodesInCollection = 0;
    let totalMinutesWatched = 0;
    let totalRatingSum = 0;
    let ratedCount = 0;

    const statusCounts = {
        'watching': 0,
        'completed': 0,
        'plan-to-watch': 0,
        'on-hold': 0,
        'dropped': 0
    };

    const genreCounts = {};

    allSeries.forEach(series => {
        const data = typeof series.data === 'function' ? series.data() : series;
        const watchedEps = Number(data.watchedEpisodes) || 0;
        const totalEps = Number(data.totalEpisodes) || 0;
        const rating = Number(data.rating) || 0;
        const status = data.status || 'plan-to-watch';

        totalWatchedEpisodes += watchedEps;
        totalEpisodesInCollection += totalEps;

        if (statusCounts[status] !== undefined) {
            statusCounts[status]++;
        } else {
            statusCounts['plan-to-watch']++;
        }

        if (rating > 0) {
            totalRatingSum += rating;
            ratedCount++;
        }

        // Determine episode runtime: from enriched TVMaze data or fallback to 45 mins
        const enriched = enrichedDataMap[String(data.tvmazeId)];
        const epRuntime = Number(enriched?.runtime || data.runtime) || 45;
        totalMinutesWatched += watchedEps * epRuntime;

        // Tally genres
        const genres = enriched?.genres || data.genres || [];
        if (Array.isArray(genres)) {
            genres.forEach(g => {
                genreCounts[g] = (genreCounts[g] || 0) + 1;
            });
        }
    });

    const averageRating = ratedCount > 0 ? (totalRatingSum / ratedCount).toFixed(1) : '—';
    const watchTime = formatWatchTime(totalMinutesWatched);

    // Sort top genres
    const sortedGenres = Object.entries(genreCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 6)
        .map(([genre, count]) => ({
            genre,
            count,
            percentage: allSeries.length > 0 ? Math.round((count / allSeries.length) * 100) : 0
        }));

    return {
        totalSeries: allSeries.length,
        totalWatchedEpisodes,
        totalEpisodesInCollection,
        watchTime,
        statusCounts,
        averageRating,
        ratedCount,
        topGenres: sortedGenres
    };
}
