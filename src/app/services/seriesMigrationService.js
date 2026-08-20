import { db } from '../firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, getDoc, query, where } from 'firebase/firestore';

/**
 * Migrates a user's series from legacy combined 'series' collection
 * to the separated 'series' (catalog) + 'userSeries' (tracking) schema,
 * and initializes 'userHistory/[userId]' for watch history.
 */
export async function migrateUserSeries(userId) {
    if (!userId) return { success: false, message: 'No userId provided' };

    try {
        console.log(`Starting client-side migration for user: ${userId}`);

        // 1. Fetch user's legacy documents from 'series' collection
        const q = query(collection(db, 'series'), where('userId', '==', userId));
        const legacySnapshot = await getDocs(q);

        if (legacySnapshot.empty) {
            console.log('No legacy documents found for this user.');
            return { success: true, count: 0 };
        }

        let migratedCount = 0;
        const legacyHistoryItems = [];

        for (const docSnap of legacySnapshot.docs) {
            const item = docSnap.data();
            const legacyId = docSnap.id;

            const tvmazeIdStr = item.tvmazeId ? item.tvmazeId.toString().trim() : '';
            const imdbIdStr = item.imdbId ? item.imdbId.toString().trim() : '';

            // Determine canonical ID for the catalog
            let canonicalId = legacyId;
            if (tvmazeIdStr) {
                canonicalId = `tv_${tvmazeIdStr}`;
            } else if (imdbIdStr) {
                canonicalId = `imdb_${imdbIdStr}`;
            }

            // 1. Save or update the shared catalog document in 'series'
            const catalogData = {
                title: item.title || 'Untitled',
                imageUrl: item.imageUrl || '',
                imdbId: imdbIdStr || '',
                tvmazeId: tvmazeIdStr || '',
                totalEpisodes: Number(item.totalEpisodes) || 0,
                seasons: Number(item.seasons) || 1,
                updatedAt: Date.now()
            };

            await setDoc(doc(db, 'series', canonicalId), catalogData, { merge: true });

            // 2. Save user tracking state in 'userSeries' (pure tracking fields only)
            const userSeriesDocId = `${userId}_${canonicalId}`;
            const userSeriesData = {
                userId: userId,
                seriesId: canonicalId,
                status: item.status || 'plan-to-watch',
                rating: Number(item.rating) || 0,
                watchedEpisodes: Number(item.watchedEpisodes) || 0,
                watchedEpisodesList: Array.isArray(item.watchedEpisodesList) ? item.watchedEpisodesList : [],
                updatedAt: Date.now()
            };

            await setDoc(doc(db, 'userSeries', userSeriesDocId), userSeriesData, { merge: true });

            // 3. Collect legacy history if present
            if (item.lastWatchedAt) {
                legacyHistoryItems.push({
                    id: `${canonicalId}_${item.lastWatchedEpisode || item.watchedEpisodes || 1}_${item.lastWatchedAt}`,
                    seriesId: canonicalId,
                    userSeriesId: userSeriesDocId,
                    seriesTitle: item.title || 'Untitled Series',
                    episodeNumber: Number(item.lastWatchedEpisode || item.watchedEpisodes) || 1,
                    seasonNumber: item.lastWatchedSeason ? Number(item.lastWatchedSeason) : null,
                    episodeInSeason: item.lastWatchedEpisodeInSeason ? Number(item.lastWatchedEpisodeInSeason) : null,
                    episodeTitle: item.lastWatchedEpisodeTitle || (item.watchedEpisodes ? `Episode ${item.watchedEpisodes}` : ''),
                    imageUrl: item.lastWatchedImage || item.imageUrl || '',
                    tvmazeId: tvmazeIdStr,
                    totalEpisodes: Number(item.totalEpisodes) || 0,
                    watchedEpisodes: Number(item.watchedEpisodes) || 0,
                    watchedAt: item.lastWatchedAt
                });
            }

            // 4. If legacyId is different from canonicalId or had user-specific fields, clean legacy doc
            if (legacyId !== canonicalId) {
                try {
                    await deleteDoc(doc(db, 'series', legacyId));
                } catch (e) {
                    console.warn(`Could not delete legacy doc ${legacyId}:`, e);
                }
            } else {
                await setDoc(doc(db, 'series', canonicalId), catalogData);
            }

            migratedCount++;
        }

        // 5. Initialize userHistory if legacy history items exist
        if (legacyHistoryItems.length > 0) {
            const historyDocRef = doc(db, 'userHistory', userId);
            const historySnap = await getDoc(historyDocRef);
            const existingItems = historySnap.exists() && Array.isArray(historySnap.data().items) ? historySnap.data().items : [];

            legacyHistoryItems.sort((a, b) => b.watchedAt - a.watchedAt);
            const combinedHistory = [...existingItems, ...legacyHistoryItems].slice(0, 20);

            await setDoc(historyDocRef, {
                userId: userId,
                items: combinedHistory,
                updatedAt: Date.now()
            }, { merge: true });
        }

        console.log(`Successfully migrated ${migratedCount} series for user ${userId}`);
        return { success: true, count: migratedCount };
    } catch (err) {
        console.error('Error during client-side migration:', err);
        return { success: false, error: err.message };
    }
}
