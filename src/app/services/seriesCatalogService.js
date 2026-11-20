import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

const DAY_MS = 24 * 60 * 60 * 1000;
// Running shows are re-checked daily, ended shows weekly (they rarely change).
const CHECK_INTERVAL_RUNNING = DAY_MS;
const CHECK_INTERVAL_ENDED = 7 * DAY_MS;

/**
 * Counts episodes and seasons from a TVMaze episode list.
 */
export function countEpisodes(episodes) {
    const list = Array.isArray(episodes) ? episodes : [];
    const seasonNumbers = list.map(ep => Number(ep.season)).filter(Boolean);
    return {
        totalEpisodes: list.length,
        seasons: seasonNumbers.length > 0 ? Math.max(...seasonNumbers) : 0
    };
}

/**
 * True when the catalog entry hasn't been checked against TVMaze recently.
 */
export function needsEpisodeCheck(catalogData) {
    if (!catalogData?.tvmazeId) return false;
    const lastCheck = Number(catalogData.episodesCheckedAt) || 0;
    const interval = catalogData.showStatus === 'Ended' ? CHECK_INTERVAL_ENDED : CHECK_INTERVAL_RUNNING;
    return Date.now() - lastCheck > interval;
}

/**
 * Writes fresh episode/season counts to the shared catalog doc ('series').
 * Falls back to the user's own 'userSeries' doc when there is no catalog entry.
 * Returns true when the episode count actually changed.
 */
export async function saveEpisodeCount({ seriesId, userSeriesId, current = {}, fresh }) {
    if (!fresh || !(fresh.totalEpisodes > 0)) return false;

    const updates = { episodesCheckedAt: Date.now() };
    const changed = fresh.totalEpisodes !== Number(current.totalEpisodes);
    if (changed) updates.totalEpisodes = fresh.totalEpisodes;
    if (fresh.seasons > 0 && fresh.seasons !== Number(current.seasons)) updates.seasons = fresh.seasons;
    if (fresh.showStatus) updates.showStatus = fresh.showStatus;

    try {
        if (!seriesId) throw new Error('No catalog id');
        await updateDoc(doc(db, 'series', seriesId), updates);
    } catch {
        if (!userSeriesId) return false;
        try {
            await updateDoc(doc(db, 'userSeries', userSeriesId), updates);
        } catch (err) {
            console.warn('Failed to save episode count:', err);
            return false;
        }
    }
    return changed;
}

/**
 * Fetches the current episode list from TVMaze and updates the stored counts.
 */
export async function refreshEpisodeCount({ seriesId, userSeriesId, tvmazeId, current = {} }) {
    if (!tvmazeId) return null;
    try {
        const res = await fetch(`https://api.tvmaze.com/shows/${tvmazeId}?embed=episodes`);
        if (!res.ok) return null;
        const show = await res.json();
        const fresh = {
            ...countEpisodes(show?._embedded?.episodes),
            showStatus: show?.status || ''
        };
        const changed = await saveEpisodeCount({ seriesId, userSeriesId, current, fresh });
        return { ...fresh, changed };
    } catch (err) {
        console.warn('Failed to refresh episode count:', err);
        return null;
    }
}
