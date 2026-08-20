import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

// In-memory cache for TVMaze episodes
const tvmazeEpisodesCache = new Map();

/**
 * Fetch and cache TVMaze episodes for a show
 */
export async function getTVMazeEpisodes(tvmazeId) {
    if (!tvmazeId) return null;
    const key = tvmazeId.toString();
    if (tvmazeEpisodesCache.has(key)) {
        return tvmazeEpisodesCache.get(key);
    }

    try {
        const res = await fetch(`https://api.tvmaze.com/shows/${key}/episodes`);
        if (!res.ok) return null;
        const episodes = await res.json();
        const mapped = episodes.map((ep, index) => ({
            ...ep,
            trackerId: index + 1
        }));
        tvmazeEpisodesCache.set(key, mapped);
        return mapped;
    } catch (err) {
        console.warn('Failed to fetch TVMaze episodes in background:', err);
        return null;
    }
}

/**
 * Records a watched episode in the user's dedicated 'userHistory/[userId]' document
 */
export async function recordWatchedEpisode({
    userId,
    userSeriesId,
    seriesId,
    seriesTitle,
    episodeNumber,
    seasonNumber,
    episodeInSeason,
    episodeTitle,
    imageUrl,
    tvmazeId,
    totalEpisodes,
    watchedEpisodes
}) {
    if (!userId) return;

    try {
        let finalSeason = seasonNumber;
        let finalEpisodeInSeason = episodeInSeason;
        let finalEpisodeTitle = episodeTitle;
        let finalImage = imageUrl;

        // If episode name/season is missing, look up from TVMaze cache or API
        if ((!finalEpisodeTitle || !finalSeason) && tvmazeId) {
            const episodes = await getTVMazeEpisodes(tvmazeId);
            if (episodes && episodes.length > 0) {
                const matchedEp = episodes.find(e => e.trackerId === episodeNumber) || episodes[episodeNumber - 1];
                if (matchedEp) {
                    finalSeason = matchedEp.season || finalSeason || 1;
                    finalEpisodeInSeason = matchedEp.number || finalEpisodeInSeason || episodeNumber;
                    finalEpisodeTitle = matchedEp.name || `Episode ${episodeNumber}`;
                    if (matchedEp.image?.medium || matchedEp.image?.original) {
                        finalImage = matchedEp.image.medium || matchedEp.image.original;
                    }
                }
            }
        }

        const historyDocRef = doc(db, 'userHistory', userId);
        const docSnap = await getDoc(historyDocRef);
        
        let currentItems = [];
        if (docSnap.exists()) {
            const data = docSnap.data();
            currentItems = Array.isArray(data.items) ? data.items : [];
        }

        const newItem = {
            id: `${seriesId || userSeriesId}_${episodeNumber}_${Date.now()}`,
            seriesId: seriesId || userSeriesId,
            userSeriesId: userSeriesId || seriesId,
            seriesTitle: seriesTitle || 'Untitled Series',
            episodeNumber: Number(episodeNumber) || 1,
            seasonNumber: finalSeason ? Number(finalSeason) : null,
            episodeInSeason: finalEpisodeInSeason ? Number(finalEpisodeInSeason) : null,
            episodeTitle: finalEpisodeTitle || `Episode ${episodeNumber}`,
            imageUrl: finalImage || '',
            tvmazeId: tvmazeId || '',
            totalEpisodes: totalEpisodes || 0,
            watchedEpisodes: watchedEpisodes || episodeNumber || 0,
            watchedAt: Date.now()
        };

        // Filter out prior entry for the exact same episode or series to keep history fresh and non-repetitive
        const filtered = currentItems.filter(item => !(
            item.seriesId === newItem.seriesId && item.episodeNumber === newItem.episodeNumber
        ));

        // Prepend newest item at the front, limit history to 20 items
        const updatedItems = [newItem, ...filtered].slice(0, 20);

        await setDoc(historyDocRef, {
            userId: userId,
            items: updatedItems,
            updatedAt: Date.now()
        }, { merge: true });

    } catch (err) {
        console.error('Error recording watched episode into userHistory:', err);
    }
}

/**
 * Remove an individual item from user history
 */
export async function removeRecentWatched(userId, itemUniqueId) {
    if (!userId || !itemUniqueId) return;
    try {
        const historyDocRef = doc(db, 'userHistory', userId);
        const docSnap = await getDoc(historyDocRef);
        if (!docSnap.exists()) return;

        const currentItems = docSnap.data().items || [];
        const updatedItems = currentItems.filter(item => 
            item.id !== itemUniqueId && item.seriesId !== itemUniqueId && item.userSeriesId !== itemUniqueId
        );

        await updateDoc(historyDocRef, {
            items: updatedItems,
            updatedAt: Date.now()
        });
    } catch (err) {
        console.error('Error removing recent watched item from userHistory:', err);
    }
}

/**
 * Clear all watch history from userHistory
 */
export async function clearAllRecentWatched(userId) {
    if (!userId) return;
    try {
        const historyDocRef = doc(db, 'userHistory', userId);
        await setDoc(historyDocRef, {
            userId: userId,
            items: [],
            updatedAt: Date.now()
        }, { merge: true });
    } catch (err) {
        console.error('Error clearing user history:', err);
    }
}

/**
 * Formats timestamp to a clean relative time string
 */
export function formatTimeAgo(timestamp) {
    if (!timestamp) return '';
    const now = Date.now();
    const diff = Math.max(0, now - timestamp);
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;

    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
