"use client";

import { useState, useMemo, useEffect, useRef } from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, where, deleteDoc, doc, updateDoc, setDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import EditSeriesModal from './EditSeriesModal';
import EpisodesModal from './EpisodesModal';
import RecentlyWatched from './RecentlyWatched';
import { recordWatchedEpisode } from '../services/recentWatchedService';
import { migrateUserSeries } from '../services/seriesMigrationService';
import { needsEpisodeCheck, refreshEpisodeCount } from '../services/seriesCatalogService';
import {
    FiFilter,
    FiShare2,
    FiCheck,
    FiCompass,
    FiShuffle,
    FiLayers,
    FiAlertTriangle
} from 'react-icons/fi';
import LoadingSpinner from './LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import SearchInput from './ui/SearchInput';
import LayoutSwitcher from './ui/LayoutSwitcher';
import SeriesCard from './series/SeriesCard';
import SeriesFilterDrawer from './series/SeriesFilterDrawer';
import SyncMissingBanner from './series/SyncMissingBanner';
import MigrationBanner from './series/MigrationBanner';
import ActiveFiltersBar from './series/filters/ActiveFiltersBar';
import Button from './ui/Button';
import EmptyState from './ui/EmptyState';
import AlertBanner from './ui/AlertBanner';
import ConfirmDialog from './ui/ConfirmDialog';
import SortMenu from './ui/SortMenu';
import StatusTabs from './ui/StatusTabs';
import useSeriesFilters, { SORT_OPTIONS } from '../hooks/useSeriesFilters';

// readOnly: show the collection without any editing controls, even to its
// owner (used on the public profile page)
export default function SeriesList({ userId, readOnly = false }) {
    const { user } = useAuth();
    const [editingSeries, setEditingSeries] = useState(null);
    const [trackingSeries, setTrackingSeries] = useState(null);
    const [pendingDelete, setPendingDelete] = useState(null);
    const [openStatusMenuId, setOpenStatusMenuId] = useState(null);
    const [copied, setCopied] = useState(false);
    const [highlightedSeriesId, setHighlightedSeriesId] = useState(null);
    const [cardLayout, setCardLayout] = useState('vertical');

    const [isSyncing, setIsSyncing] = useState(false);
    const [syncStatus, setSyncStatus] = useState('');
    const [isMigrating, setIsMigrating] = useState(false);
    const [migrationMessage, setMigrationMessage] = useState('');

    const isOwner = !readOnly && user?.uid === userId;

    // 1. Stable memoized query for userSeries
    const userSeriesQuery = useMemo(() => {
        if (!userId) return null;
        return query(collection(db, 'userSeries'), where('userId', '==', userId));
    }, [userId]);
    const [userSeriesSnap, userLoading, userError] = useCollection(userSeriesQuery);

    // 2. Stable memoized query for shared series catalog
    const catalogQuery = useMemo(() => collection(db, 'series'), []);
    const [catalogSnap, catalogLoading, catalogError] = useCollection(catalogQuery);

    const [hasLegacyDocs, setHasLegacyDocs] = useState(false);
    const [legacyDocsList, setLegacyDocsList] = useState([]);

    // Check once if legacy unmigrated data exists when userSeries is empty
    useEffect(() => {
        if (!userId || !isOwner || userLoading) return;
        if ((userSeriesSnap?.docs?.length || 0) === 0) {
            getDocs(query(collection(db, 'series'), where('userId', '==', userId)))
                .then(snap => {
                    if (!snap.empty) {
                        setHasLegacyDocs(true);
                        setLegacyDocsList(snap.docs);
                    } else {
                        setHasLegacyDocs(false);
                        setLegacyDocsList([]);
                    }
                })
                .catch(() => {
                    setHasLegacyDocs(false);
                    setLegacyDocsList([]);
                });
        } else {
            setHasLegacyDocs(false);
            setLegacyDocsList([]);
        }
    }, [userId, isOwner, userLoading, userSeriesSnap]);

    const loading = userLoading || catalogLoading;
    const error = userError || catalogError;

    const allSeries = useMemo(() => {
        if (userSeriesSnap?.docs && userSeriesSnap.docs.length > 0) {
            const catalogMap = new Map();
            if (catalogSnap?.docs) {
                catalogSnap.docs.forEach(docSnap => {
                    const data = docSnap.data();
                    catalogMap.set(docSnap.id, data);
                    if (data.tvmazeId) catalogMap.set(`tv_${data.tvmazeId}`, data);
                    if (data.imdbId) catalogMap.set(`imdb_${data.imdbId}`, data);
                });
            }

            return userSeriesSnap.docs.map(userDoc => {
                const uData = userDoc.data();
                const cData = catalogMap.get(uData.seriesId) || {};

                return {
                    id: userDoc.id,
                    userSeriesId: userDoc.id,
                    seriesId: uData.seriesId,
                    title: cData.title || uData.title || 'Untitled',
                    imageUrl: cData.imageUrl || uData.imageUrl || '',
                    imdbId: cData.imdbId || uData.imdbId || '',
                    tvmazeId: cData.tvmazeId || uData.tvmazeId || '',
                    totalEpisodes: Number(cData.totalEpisodes ?? uData.totalEpisodes) || 0,
                    seasons: Number(cData.seasons ?? uData.seasons) || 1,
                    status: uData.status || 'plan-to-watch',
                    rating: Number(uData.rating) || 0,
                    watchedEpisodes: Number(uData.watchedEpisodes) || 0,
                    watchedEpisodesList: Array.isArray(uData.watchedEpisodesList) ? uData.watchedEpisodesList : [],
                    network: cData.network || uData.network || '',
                    webChannel: cData.webChannel || uData.webChannel || '',
                    streamingService: cData.streamingService || uData.streamingService || '',
                    episodesCheckedAt: Number(cData.episodesCheckedAt ?? uData.episodesCheckedAt) || 0,
                    showStatus: cData.showStatus || uData.showStatus || '',
                    reopenedForTotal: Number(uData.reopenedForTotal) || 0,
                    userId: uData.userId,
                    data: function() { return this; }
                };
            });
        }

        if (legacyDocsList.length > 0) {
            return legacyDocsList.map(docSnap => {
                const data = docSnap.data();
                return {
                    id: docSnap.id,
                    userSeriesId: docSnap.id,
                    seriesId: docSnap.id,
                    title: data.title || 'Untitled',
                    imageUrl: data.imageUrl || '',
                    imdbId: data.imdbId || '',
                    tvmazeId: data.tvmazeId || '',
                    totalEpisodes: Number(data.totalEpisodes) || 0,
                    seasons: Number(data.seasons) || 1,
                    status: data.status || 'plan-to-watch',
                    rating: Number(data.rating) || 0,
                    watchedEpisodes: Number(data.watchedEpisodes) || 0,
                    watchedEpisodesList: Array.isArray(data.watchedEpisodesList) ? data.watchedEpisodesList : [],
                    episodesCheckedAt: Number(data.episodesCheckedAt) || 0,
                    showStatus: data.showStatus || '',
                    reopenedForTotal: Number(data.reopenedForTotal) || 0,
                    userId: data.userId,
                    // Pre-migration doc stored straight in 'series'
                    isLegacy: true,
                    data: function() { return this; }
                };
            });
        }

        return [];
    }, [userSeriesSnap, catalogSnap, legacyDocsList]);

    const isEmptyCollection = !loading && allSeries.length === 0;

    // Background check for newly aired episodes/seasons. Runs one series at a time
    // (TVMaze rate limit) and survives re-renders caused by its own catalog writes.
    const episodeCheckRef = useRef({ running: false, unmounted: false, checked: new Set() });
    useEffect(() => {
        const state = episodeCheckRef.current;
        state.unmounted = false;
        return () => { state.unmounted = true; };
    }, []);

    useEffect(() => {
        const state = episodeCheckRef.current;
        if (!isOwner || loading || state.running) return;

        const queue = allSeries.filter(s => !state.checked.has(s.userSeriesId) && needsEpisodeCheck(s));
        if (queue.length === 0) return;

        state.running = true;
        (async () => {
            for (const item of queue) {
                if (state.unmounted) break;
                state.checked.add(item.userSeriesId);
                await refreshEpisodeCount({
                    seriesId: item.seriesId,
                    userSeriesId: item.userSeriesId,
                    tvmazeId: item.tvmazeId,
                    current: { totalEpisodes: item.totalEpisodes, seasons: item.seasons }
                });
                await new Promise(r => setTimeout(r, 600));
            }
            state.running = false;
        })();
    }, [allSeries, isOwner, loading]);

    // A finished series gets new episodes -> move it back to "watching".
    // reopenedForTotal makes this happen once per episode-count change, so a manual
    // "completed" set afterwards sticks until the next new episodes.
    const reopenedRef = useRef(new Set());
    useEffect(() => {
        if (!isOwner || loading) return;
        allSeries.forEach(s => {
            const total = s.totalEpisodes;
            if (s.status !== 'completed' || total <= 0) return;
            if (s.watchedEpisodes <= 0 || s.watchedEpisodes >= total) return;
            if (s.reopenedForTotal === total) return;

            const key = `${s.userSeriesId}_${total}`;
            if (reopenedRef.current.has(key)) return;
            reopenedRef.current.add(key);

            const payload = { status: 'watching', reopenedForTotal: total };
            updateDoc(doc(db, 'userSeries', s.userSeriesId), payload)
                .catch(() => updateDoc(doc(db, 'series', s.userSeriesId), payload))
                .catch(e => console.error('Failed to reopen series:', e));
        });
    }, [allSeries, isOwner, loading]);

    const seriesNeedingSync = useMemo(() => {
        if (!isOwner) return [];
        return allSeries.filter(d => !d.tvmazeId);
    }, [allSeries, isOwner]);

    const handleRunMigration = async () => {
        if (!userId) return;
        setIsMigrating(true);
        setMigrationMessage('');
        try {
            const res = await migrateUserSeries(userId);
            setMigrationMessage(`Migration complete! Successfully migrated ${res.migratedCount} series.`);
            setHasLegacyDocs(false);
            setLegacyDocsList([]);
        } catch (err) {
            console.error('Migration failed:', err);
            setMigrationMessage('Migration failed: ' + err.message);
        } finally {
            setIsMigrating(false);
        }
    };

    const handleAutoSync = async () => {
        if (isSyncing || seriesNeedingSync.length === 0) return;
        setIsSyncing(true);
        setSyncStatus('Searching TVMaze API...');

        try {
            let fixed = 0;
            for (const item of seriesNeedingSync) {
                setSyncStatus(`Searching: ${item.title}...`);
                const res = await fetch(`https://api.tvmaze.com/singlesearch/shows?q=${encodeURIComponent(item.title)}`);
                if (res.ok) {
                    const tvShow = await res.json();
                    const updates = {
                        tvmazeId: tvShow.id.toString(),
                        imdbId: tvShow.externals?.imdb || item.imdbId || '',
                        imageUrl: item.imageUrl || tvShow.image?.original || tvShow.image?.medium || ''
                    };
                    
                    if (item.seriesId) {
                        await updateDoc(doc(db, 'series', item.seriesId), updates).catch(() => {});
                    }
                    await updateDoc(doc(db, 'userSeries', item.id), updates).catch(() => {});
                    fixed++;
                }
                await new Promise(r => setTimeout(r, 250));
            }
            setSyncStatus(`Synced ${fixed} of ${seriesNeedingSync.length} series!`);
            setTimeout(() => setSyncStatus(''), 4000);
        } catch (e) {
            console.error('Sync error:', e);
            setSyncStatus('Error syncing with TVMaze');
        } finally {
            setIsSyncing(false);
        }
    };

    // Search, status tabs, panel filters and sorting
    const filterState = useSeriesFilters(allSeries);
    const { filters, set: setFilter, results: processedSeries } = filterState;

    const handleCopyLink = async () => {
        try {
            const shareUrl = `${window.location.origin}/profile/${userId}`;
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy collection link: ', err);
        }
    };

    // Ask first; the actual delete runs from the ConfirmDialog below
    const handleDelete = (userSeriesId) => {
        if (!isOwner) return;
        const item = allSeries.find(s => s.userSeriesId === userSeriesId);
        if (item) setPendingDelete(item);
    };

    const confirmDelete = async () => {
        const item = pendingDelete;
        if (!item || !isOwner) return;
        try {
            // Legacy docs live in 'series' itself; never touch the shared catalog otherwise
            await deleteDoc(doc(db, item.isLegacy ? 'series' : 'userSeries', item.userSeriesId));
        } catch (e) {
            console.error('Failed to remove series: ', e);
        }
        setPendingDelete(null);
    };

    const handleStatusChange = async (userSeriesId, newStatus) => {
        if (!isOwner) return;
        try {
            await updateDoc(doc(db, 'userSeries', userSeriesId), { status: newStatus });
        } catch {
            try { await updateDoc(doc(db, 'series', userSeriesId), { status: newStatus }); } catch (e) { console.error(e); }
        }
    };

    const handleJumpToSeries = (seriesId) => {
        setHighlightedSeriesId(seriesId);
        const matching = allSeries.find(d => d.id === seriesId || d.userSeriesId === seriesId || d.seriesId === seriesId);
        if (matching) {
            if (filters.query && !matching.title?.toLowerCase().includes(filters.query.toLowerCase().trim())) {
                setFilter('query', '');
            }
            if (filters.status && matching.status !== filters.status) {
                setFilter('status', '');
            }
        }
        
        setTimeout(() => {
            const element = document.getElementById(`series-card-${seriesId}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 50);

        setTimeout(() => {
            setHighlightedSeriesId(prev => (prev === seriesId ? null : prev));
        }, 2500);
    };

    const handleWatchedEpisodesChange = async (userSeriesId, newCount, seriesData) => {
        if (!isOwner) return;

        let count = parseInt(newCount) || 0;
        if (count < 0) count = 0;
        if (count > seriesData.totalEpisodes) count = seriesData.totalEpisodes;

        let currentList = seriesData.watchedEpisodesList || [];
        if (count === currentList.length) return;

        let newList = [...currentList];

        if (count > currentList.length) {
            const episodesToAdd = count - currentList.length;
            let nextId = 1;
            let added = 0;
            
            while (added < episodesToAdd && nextId <= seriesData.totalEpisodes) {
                if (!newList.includes(nextId)) {
                    newList.push(nextId);
                    added++;
                }
                nextId++;
            }
        } else {
            const episodesToRemove = currentList.length - count;
            newList.sort((a, b) => a - b);
            newList.splice(newList.length - episodesToRemove, episodesToRemove);
        }

        const updatePayload = { 
            watchedEpisodes: count,
            watchedEpisodesList: newList,
            status: count === seriesData.totalEpisodes && seriesData.totalEpisodes > 0 ? 'completed' : seriesData.status
        };

        try {
            await updateDoc(doc(db, 'userSeries', userSeriesId), updatePayload);
        } catch {
            try { await updateDoc(doc(db, 'series', userSeriesId), updatePayload); } catch (e) { console.error(e); }
        }

        if (count > currentList.length) {
            recordWatchedEpisode({
                userId,
                userSeriesId,
                seriesId: seriesData.seriesId || userSeriesId,
                seriesTitle: seriesData.title,
                imageUrl: seriesData.imageUrl,
                episodeNumber: count,
                tvmazeId: seriesData.tvmazeId,
                totalEpisodes: seriesData.totalEpisodes,
                watchedEpisodes: count
            });
        }
    };

    const handleRatingChange = async (userSeriesId, newRating) => {
        if (!isOwner) return;
        try {
            await updateDoc(doc(db, 'userSeries', userSeriesId), { rating: newRating });
        } catch {
            try { await updateDoc(doc(db, 'series', userSeriesId), { rating: newRating }); } catch (e) { console.error(e); }
        }
    };

    if (loading) return <LoadingSpinner />;

    if (error) {
        return (
            <AlertBanner
                tone="danger"
                icon={FiAlertTriangle}
                title="Couldn't load your collection"
                description={error.message}
            />
        );
    }

    if (isEmptyCollection) {
        return (
            <EmptyState
                icon={FiLayers}
                title={isOwner ? 'Your collection is empty' : 'Nothing tracked yet'}
                description={isOwner
                    ? 'Find a series in the catalog and add it to start tracking episodes.'
                    : "This collection doesn't have any series yet."}
                className="max-w-3xl mx-auto"
                action={
                    <>
                        {isOwner && (
                            <Button variant="primary" href="/explore" icon={FiCompass}>
                                Explore series
                            </Button>
                        )}
                        {!readOnly && (
                            <Button icon={copied ? FiCheck : FiShare2} onClick={handleCopyLink}>
                                {copied ? 'Link copied' : 'Copy collection link'}
                            </Button>
                        )}
                    </>
                }
            />
        );
    }

    return (
        <div className="space-y-6">
            {/* Action Banner for Missing TVMaze/IMDb IDs */}
            {isOwner && (
                <SyncMissingBanner
                    missingCount={seriesNeedingSync.length}
                    isSyncing={isSyncing}
                    syncStatus={syncStatus}
                    onAutoSync={handleAutoSync}
                />
            )}

            {/* Optional Migration Banner if unmigrated legacy docs exist */}
            {hasLegacyDocs && (
                <MigrationBanner
                    isMigrating={isMigrating}
                    onRunMigration={handleRunMigration}
                />
            )}

            {migrationMessage && (
                <AlertBanner
                    tone={migrationMessage.startsWith('Migration failed') ? 'danger' : 'success'}
                    icon={migrationMessage.startsWith('Migration failed') ? FiAlertTriangle : FiCheck}
                    title={migrationMessage}
                />
            )}

            {/* Recently Watched Shelf */}
            <RecentlyWatched 
                userId={userId} 
                isOwner={isOwner} 
                allSeries={allSeries} 
                onOpenTracker={(seriesData) => setTrackingSeries(seriesData)} 
                onJumpToSeries={handleJumpToSeries} 
                onWatchedEpisodesChange={handleWatchedEpisodesChange}
            />

            {/* Top Control Bar */}
            <div className="flex flex-col lg:flex-row gap-3 justify-between items-stretch lg:items-center">
                
                {/* Reusable Search Field */}
                <SearchInput
                    value={filters.query}
                    onChange={(e) => setFilter('query', e.target.value)}
                    onClear={() => setFilter('query', '')}
                    placeholder={isOwner ? "Search by title..." : "Search this collection..."}
                    className="lg:max-w-md"
                />

                {/* Action Controls & Layout Switcher */}
                <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center justify-end">
                    
                    {/* Reusable Layout Switcher */}
                    <LayoutSwitcher
                        cardLayout={cardLayout}
                        setCardLayout={setCardLayout}
                    />

                    {/* On the profile page the header already has "Share profile" */}
                    {!readOnly && (
                        <>
                            <Button icon={copied ? FiCheck : FiShare2} onClick={handleCopyLink}>
                                {copied ? 'Copied' : 'Share'}
                            </Button>

                            <Button
                                icon={FiShuffle}
                                href="/roulette"
                                title="Pick something to watch at random"
                            >
                                <span className="hidden sm:inline">Roulette</span>
                            </Button>
                        </>
                    )}

                    <SortMenu options={SORT_OPTIONS} value={filterState.sort} onChange={filterState.setSort} />

                    <SeriesFilterDrawer state={filterState} />
                </div>
            </div>

            <StatusTabs
                value={filters.status}
                onChange={(value) => setFilter('status', value)}
                counts={filterState.statusCounts}
            />

            <ActiveFiltersBar state={filterState} />

            {/* Series Cards Grid with SeriesCard */}
            <div className={
                cardLayout === 'vertical'
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5"
                    : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5"
            }>
                {processedSeries.map((item) => (
                    <SeriesCard
                        key={item.id}
                        series={item}
                        cardLayout={cardLayout}
                        isOwner={isOwner}
                        isHighlighted={highlightedSeriesId === item.id}
                        isOpenStatusMenu={openStatusMenuId === item.id}
                        onToggleStatusMenu={(id) => setOpenStatusMenuId(id)}
                        onStatusChange={handleStatusChange}
                        onRatingChange={handleRatingChange}
                        onWatchedEpisodesChange={handleWatchedEpisodesChange}
                        onOpenTracker={(seriesData) => setTrackingSeries(seriesData)}
                        onEdit={(seriesData) => setEditingSeries(seriesData)}
                        onDelete={handleDelete}
                    />
                ))}
            </div>

            {/* Empty Search/Filter State */}
            {processedSeries.length === 0 && (
                <EmptyState
                    icon={FiFilter}
                    title="No series match these filters"
                    description="Try a different search term or clear some filters."
                    action={<Button onClick={filterState.resetAll}>Reset filters</Button>}
                />
            )}

            {/* Modals */}
            <ConfirmDialog
                isOpen={!!pendingDelete}
                title={pendingDelete ? `Remove “${pendingDelete.title}” from your collection?` : ''}
                description="Your progress and rating for this series will be lost."
                confirmLabel="Remove"
                onConfirm={confirmDelete}
                onCancel={() => setPendingDelete(null)}
            />

            {isOwner && editingSeries && (
                <EditSeriesModal 
                    series={editingSeries} 
                    isOpen={!!editingSeries} 
                    onClose={() => setEditingSeries(null)} 
                    userId={userId} 
                />
            )}

            {trackingSeries && (
                <EpisodesModal 
                    series={trackingSeries} 
                    isOpen={!!trackingSeries} 
                    onClose={() => setTrackingSeries(null)} 
                    userId={userId} 
                    isOwner={isOwner} 
                />
            )}
        </div>
    );
}