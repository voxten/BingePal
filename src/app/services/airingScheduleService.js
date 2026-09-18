import { fetchTVMazeShowDetails } from './bingeStatsService';

/**
 * Calculates countdown string from a date string (YYYY-MM-DD)
 */
export function getDaysUntil(airdateStr) {
    if (!airdateStr) return { days: null, text: 'TBA' };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const parts = airdateStr.split('-');
    if (parts.length !== 3) return { days: null, text: airdateStr };

    const airDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    airDate.setHours(0, 0, 0, 0);

    const diffTime = airDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return { days: diffDays, text: 'Aired' };
    }
    if (diffDays === 0) {
        return { days: 0, text: 'Today' };
    }
    if (diffDays === 1) {
        return { days: 1, text: 'Tomorrow' };
    }
    if (diffDays < 7) {
        return { days: diffDays, text: `In ${diffDays} days` };
    }
    return { days: diffDays, text: airDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) };
}

const AIR_WINDOWS = [
    { key: 'today', label: 'Today', test: (days) => days === 0 },
    { key: 'tomorrow', label: 'Tomorrow', test: (days) => days === 1 },
    { key: 'this-week', label: 'This week', test: (days) => days >= 2 && days <= 6 },
    { key: 'later', label: 'Later', test: (days) => days >= 7 },
];

/**
 * Groups upcoming items (already sorted by date) into Today / Tomorrow / This week / Later.
 * Empty groups are omitted.
 */
export function groupByAirWindow(upcoming = []) {
    return AIR_WINDOWS
        .map(({ key, label, test }) => ({
            key,
            label,
            items: upcoming.filter(item => test(item.nextEpisode?.countdown?.days)),
        }))
        .filter(group => group.items.length > 0);
}

/**
 * Fetches and builds upcoming airing schedule for tracked series
 */
export async function getUpcomingSchedule(seriesList = []) {
    const candidates = seriesList.filter(s => {
        const data = typeof s.data === 'function' ? s.data() : s;
        return data.tvmazeId && data.status !== 'dropped';
    });

    const scheduleResults = await Promise.all(
        candidates.map(async (series) => {
            const data = typeof series.data === 'function' ? series.data() : series;
            const showDetails = await fetchTVMazeShowDetails(data.tvmazeId);
            if (!showDetails) return null;

            const nextEp = showDetails._embedded?.nextepisode;
            const status = showDetails.status; // "Running", "Ended", "In Development"

            return {
                seriesId: data.seriesId || data.id,
                userSeriesId: data.id || data.userSeriesId,
                title: data.title || showDetails.name,
                imageUrl: data.imageUrl || showDetails.image?.original || showDetails.image?.medium,
                network: showDetails.webChannel?.name || showDetails.network?.name || '',
                seriesStatus: status,
                userStatus: data.status,
                nextEpisode: nextEp ? {
                    id: nextEp.id,
                    name: nextEp.name,
                    season: nextEp.season,
                    number: nextEp.number,
                    airdate: nextEp.airdate,
                    airtime: nextEp.airtime,
                    runtime: nextEp.runtime,
                    summary: nextEp.summary,
                    countdown: getDaysUntil(nextEp.airdate)
                } : null
            };
        })
    );

    const valid = scheduleResults.filter(Boolean);

    // Split into upcoming airings and completed/ended shows
    const upcoming = valid
        .filter(item => item.nextEpisode && item.nextEpisode.countdown.days !== null && item.nextEpisode.countdown.days >= 0)
        .sort((a, b) => a.nextEpisode.countdown.days - b.nextEpisode.countdown.days);

    const ongoingNoDate = valid
        .filter(item => item.seriesStatus === 'Running' && !item.nextEpisode);

    const ended = valid
        .filter(item => item.seriesStatus === 'Ended' && !item.nextEpisode);

    return {
        upcoming,
        ongoingNoDate,
        ended
    };
}
