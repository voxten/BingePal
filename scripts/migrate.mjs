import { initializeApp } from "firebase/app";
import { 
    getFirestore, 
    collection, 
    getDocs, 
    doc, 
    setDoc, 
    deleteDoc, 
    writeBatch 
} from "firebase/firestore";
import fs from "fs";
import path from "path";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function runMigration() {
    console.log("Starting migration to separate 'series' and 'userSeries' collections...");

    // Read the backup data
    const backupPath = path.resolve(process.cwd(), "backups", "backup_series_latest.json");
    if (!fs.existsSync(backupPath)) {
        console.error("Backup file not found at:", backupPath);
        process.exit(1);
    }

    const rawData = JSON.parse(fs.readFileSync(backupPath, "utf-8"));
    console.log(`Loaded ${rawData.length} items from backup.`);

    // Map to track unique canonical series documents
    // key can be tvmaze_{id} or imdb_{id} or original doc ID
    const seriesCatalog = new Map();
    const userSeriesList = [];
    const oldDocIdsToDelete = new Set();

    for (const item of rawData) {
        let canonicalId = item._id;
        const tvmazeIdStr = item.tvmazeId ? item.tvmazeId.toString().trim() : '';
        const imdbIdStr = item.imdbId ? item.imdbId.toString().trim() : '';

        if (tvmazeIdStr) {
            canonicalId = `tv_${tvmazeIdStr}`;
        } else if (imdbIdStr) {
            canonicalId = `imdb_${imdbIdStr}`;
        }

        if (canonicalId !== item._id) {
            oldDocIdsToDelete.add(item._id);
        }

        // Clean series catalog data
        const seriesData = {
            title: item.title || 'Untitled',
            imageUrl: item.imageUrl || '',
            imdbId: imdbIdStr || '',
            tvmazeId: tvmazeIdStr || '',
            totalEpisodes: Number(item.totalEpisodes) || 0,
            seasons: Number(item.seasons) || 1,
            updatedAt: Date.now()
        };

        // If not added or if this item has more complete metadata
        if (!seriesCatalog.has(canonicalId)) {
            seriesCatalog.set(canonicalId, seriesData);
        } else {
            const existing = seriesCatalog.get(canonicalId);
            seriesCatalog.set(canonicalId, {
                ...existing,
                ...seriesData,
                totalEpisodes: Math.max(existing.totalEpisodes || 0, seriesData.totalEpisodes || 0),
                seasons: Math.max(existing.seasons || 0, seriesData.seasons || 0),
                imageUrl: seriesData.imageUrl || existing.imageUrl
            });
        }

        // Clean userSeries data
        const userSeriesDocId = `${item.userId}_${canonicalId}`;
        const userSeriesData = {
            userId: item.userId,
            seriesId: canonicalId,
            status: item.status || 'plan-to-watch',
            rating: Number(item.rating) || 0,
            watchedEpisodes: Number(item.watchedEpisodes) || 0,
            watchedEpisodesList: Array.isArray(item.watchedEpisodesList) ? item.watchedEpisodesList : [],
            lastWatchedAt: item.lastWatchedAt || null,
            lastWatchedEpisode: item.lastWatchedEpisode || null,
            lastWatchedSeason: item.lastWatchedSeason || null,
            lastWatchedEpisodeInSeason: item.lastWatchedEpisodeInSeason || null,
            lastWatchedEpisodeTitle: item.lastWatchedEpisodeTitle || null,
            lastWatchedImage: item.lastWatchedImage || null,
            updatedAt: Date.now()
        };

        userSeriesList.push({
            id: userSeriesDocId,
            data: userSeriesData
        });
    }

    console.log(`Writing ${seriesCatalog.size} unique series to 'series' collection...`);
    for (const [canonicalId, data] of seriesCatalog.entries()) {
        await setDoc(doc(db, "series", canonicalId), data, { merge: false });
    }

    console.log(`Writing ${userSeriesList.length} tracking records to 'userSeries' collection...`);
    for (const userItem of userSeriesList) {
        await setDoc(doc(db, "userSeries", userItem.id), userItem.data, { merge: true });
    }

    console.log(`Cleaning up ${oldDocIdsToDelete.size} superseded legacy documents from 'series'...`);
    for (const oldId of oldDocIdsToDelete) {
        if (!seriesCatalog.has(oldId)) {
            await deleteDoc(doc(db, "series", oldId));
        }
    }

    console.log("Migration completed successfully!");
    console.log(`- Unique Series in catalog: ${seriesCatalog.size}`);
    console.log(`- User Tracking entries in userSeries: ${userSeriesList.length}`);
}

runMigration().catch(err => {
    console.error("Migration failed:", err);
    process.exit(1);
});
