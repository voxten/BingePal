"use client";

import { useState, useMemo, useEffect } from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, where, deleteDoc, doc, updateDoc, setDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import AddSeriesModal from './AddSeriesModal';
import EditSeriesModal from './EditSeriesModal';
import EpisodesModal from './EpisodesModal';
import RecentlyWatched from './RecentlyWatched';
import { recordWatchedEpisode } from '../services/recentWatchedService';
import { migrateUserSeries } from '../services/seriesMigrationService';
import Link from 'next/link';
import { 
    FiFilter, 
    FiShare2, 
    FiCheck, 
    FiSliders, 
    FiCompass 
} from 'react-icons/fi';
import LoadingSpinner from './LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import SearchInput from './ui/SearchInput';
import LayoutSwitcher from './ui/LayoutSwitcher';
import Toast from './ui/Toast';
import SeriesCard from './series/SeriesCard';
import SeriesFilterDrawer from './series/SeriesFilterDrawer';
import SyncMissingBanner from './series/SyncMissingBanner';
import MigrationBanner from './series/MigrationBanner';
import { STATUS_CONFIG } from './ui/StatusBadge';

const SORT_OPTIONS = [
    { label: 'Title (A-Z)', value: 'title' },
    { label: 'Rating (High to Low)', value: 'rating' },
    { label: 'Progress (%)', value: 'progress' },
    { label: 'Watched Episodes', value: 'watchedEpisodes' },
    { label: 'Total Episodes', value: 'totalEpisodes' },
    { label: 'Seasons', value: 'seasons' }
];

export default function SeriesList({ userId }) {
    const { user } = useAuth();
    const [editingSeries, setEditingSeries] = useState(null);
    const [trackingSeries, setTrackingSeries] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [openStatusMenuId, setOpenStatusMenuId] = useState(null);
    const [copied, setCopied] = useState(false);
    const [highlightedSeriesId, setHighlightedSeriesId] = useState(null);
    const [cardLayout, setCardLayout] = useState('vertical');

    const [filters, setFilters] = useState({
        searchQuery: '',
        status: '',
        progressStatus: '',
        seasonsMin: '',
        seasonsMax: '',
        episodesMin: '',
        episodesMax: '',
        ratingMin: '',
        ratingMax: ''
    });

    const [showFilters, setShowFilters] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncStatus, setSyncStatus] = useState('');
    const [isMigrating, setIsMigrating] = useState(false);
    const [migrationMessage, setMigrationMessage] = useState('');

    const [sortConfig, setSortConfig] = useState({
        key: 'title',
        direction: 'asc'
    });

    const isOwner = user?.uid === userId;

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
                    userId: data.userId,
                    data: function() { return this; }
                };
            });
        }

        return [];
    }, [userSeriesSnap, catalogSnap, legacyDocsList]);

    const isEmptyCollection = !loading && allSeries.length === 0;

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

    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (filters.status) count++;
        if (filters.progressStatus) count++;
        if (filters.seasonsMin || filters.seasonsMax) count++;
        if (filters.episodesMin || filters.episodesMax) count++;
        if (filters.ratingMin || filters.ratingMax) count++;
        return count;
    }, [filters]);

    const processedSeries = useMemo(() => {
        return allSeries
            .filter((series) => {
                const title = series.title || '';
                const query = filters.searchQuery.toLowerCase().trim();
                
                if (query && !title.toLowerCase().includes(query)) {
                    return false;
                }

                if (filters.status && series.status !== filters.status) {
                    return false;
                }

                const total = series.totalEpisodes || 0;
                const watched = series.watchedEpisodes || 0;
                const percent = total > 0 ? (watched / total) * 100 : 0;

                if (filters.progressStatus) {
                    if (filters.progressStatus === 'not-started' && watched !== 0) return false;
                    if (filters.progressStatus === 'in-progress' && (percent <= 0 || percent >= 100)) return false;
                    if (filters.progressStatus === 'completed' && percent < 100) return false;
                }

                const seasons = series.seasons || 1;
                if (filters.seasonsMin && seasons < parseInt(filters.seasonsMin)) return false;
                if (filters.seasonsMax && seasons > parseInt(filters.seasonsMax)) return false;

                if (filters.episodesMin && watched < parseInt(filters.episodesMin)) return false;
                if (filters.episodesMax && watched > parseInt(filters.episodesMax)) return false;

                const rating = series.rating || 0;
                if (filters.ratingMin && rating < parseInt(filters.ratingMin)) return false;
                if (filters.ratingMax && rating > parseInt(filters.ratingMax)) return false;

                return true;
            })
            .sort((a, b) => {
                let aVal, bVal;

                switch (sortConfig.key) {
                    case 'rating':
                        aVal = a.rating || 0;
                        bVal = b.rating || 0;
                        break;
                    case 'progress': {
                        const aProg = (a.totalEpisodes || 0) > 0 ? (a.watchedEpisodes || 0) / a.totalEpisodes : 0;
                        const bProg = (b.totalEpisodes || 0) > 0 ? (b.watchedEpisodes || 0) / b.totalEpisodes : 0;
                        aVal = aProg;
                        bVal = bProg;
                        break;
                    }
                    case 'watchedEpisodes':
                        aVal = a.watchedEpisodes || 0;
                        bVal = b.watchedEpisodes || 0;
                        break;
                    case 'totalEpisodes':
                        aVal = a.totalEpisodes || 0;
                        bVal = b.totalEpisodes || 0;
                        break;
                    case 'seasons':
                        aVal = a.seasons || 0;
                        bVal = b.seasons || 0;
                        break;
                    case 'title':
                    default:
                        aVal = (a.title || '').toLowerCase();
                        bVal = (b.title || '').toLowerCase();
                        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                        return 0;
                }

                if (sortConfig.direction === 'asc') {
                    return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
                } else {
                    return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
                }
            });
    }, [allSeries, filters, sortConfig]);

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

    const handleDelete = async (userSeriesId) => {
        if (!isOwner) return;
        if (window.confirm('Are you sure you want to delete this series from your collection?')) {
            try {
                await deleteDoc(doc(db, 'userSeries', userSeriesId));
            } catch {
                try { await deleteDoc(doc(db, 'series', userSeriesId)); } catch (e) { console.error(e); }
            }
        }
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
            if (filters.searchQuery && !matching.title?.toLowerCase().includes(filters.searchQuery.toLowerCase().trim())) {
                setFilters(prev => ({ ...prev, searchQuery: '' }));
            }
            if (filters.status && matching.status !== filters.status) {
                setFilters(prev => ({ ...prev, status: '' }));
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

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleRemoveFilter = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const resetFilters = () => {
        setFilters({ 
            searchQuery: '', 
            status: '', 
            progressStatus: '', 
            seasonsMin: '', 
            seasonsMax: '', 
            episodesMin: '', 
            episodesMax: '', 
            ratingMin: '', 
            ratingMax: '' 
        });
        setSortConfig({ key: 'title', direction: 'asc' });
    };

    const toggleSortDirection = () => {
        setSortConfig(prev => ({
            ...prev,
            direction: prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    if (loading) return <LoadingSpinner />;

    if (error) {
        return (
            <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-700 p-4 mb-6 rounded-r-xl shadow-sm dark:bg-rose-950/30 dark:text-rose-400">
                <p className="font-medium">Error loading series: {error.message}</p>
            </div>
        );
    }

    if (isEmptyCollection) {
        return (
            <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl mx-auto px-4">
                <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    {isOwner ? "Welcome to your tracking space" : "No tracking activity discovered"}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto text-sm">
                    {isOwner
                        ? "Get started by building your ultimate series collection tracker."
                        : "This collection doesn't contain any tracked media files yet."}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                    {isOwner && (
                        <>
                            <Link 
                                href="/explore" 
                                className="bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-medium px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-500/20 text-sm w-full sm:w-auto flex items-center justify-center gap-2"
                            >
                                <FiCompass className="w-4 h-4" />
                                <span>Explore & Add First Series</span>
                            </Link>
                            <AddSeriesModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} userId={userId} />
                        </>
                    )}
                    <button onClick={handleCopyLink} className={`flex items-center justify-center gap-2 font-medium px-6 py-2.5 rounded-xl transition-all border text-sm w-full sm:w-auto cursor-pointer ${copied ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : 'bg-white border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                        {copied ? <FiCheck className="w-4 h-4" /> : <FiShare2 className="w-4 h-4" />}
                        <span>{copied ? 'Link Copied!' : 'Copy Collection Link'}</span>
                    </button>
                </div>
            </div>
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
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-semibold">
                    {migrationMessage}
                </div>
            )}

            {/* Recently Watched Shelf */}
            <RecentlyWatched 
                userId={userId} 
                isOwner={isOwner} 
                allSeries={allSeries} 
                onOpenTracker={(seriesData) => setTrackingSeries(seriesData)} 
                onJumpToSeries={handleJumpToSeries} 
            />

            {/* Top Control Bar */}
            <div className="flex flex-col lg:flex-row gap-3 justify-between items-stretch lg:items-center">
                
                {/* Reusable Search Field */}
                <SearchInput
                    value={filters.searchQuery}
                    onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                    onClear={() => setFilters(prev => ({ ...prev, searchQuery: '' }))}
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

                    {/* Share Button */}
                    <button 
                        onClick={handleCopyLink} 
                        className={`flex items-center justify-center gap-2 font-medium px-4 h-[42px] rounded-xl transition-all border text-sm w-full sm:w-auto cursor-pointer ${
                            copied 
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-sm' 
                                : 'bg-white border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-sm'
                        }`}
                    >
                        {copied ? <FiCheck className="w-4 h-4 text-emerald-500" /> : <FiShare2 className="w-4 h-4" />}
                        <span>{copied ? 'Copied!' : 'Share'}</span>
                    </button>

                    {/* Filters & Sort Toggle Button */}
                    <button 
                        onClick={() => setShowFilters(!showFilters)} 
                        className={`relative flex items-center justify-center gap-2 font-medium px-4 h-[42px] rounded-xl transition-all w-full sm:w-auto border text-sm shadow-sm cursor-pointer ${
                            showFilters || activeFiltersCount > 0
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-300' 
                                : 'bg-white border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                    >
                        <FiSliders className="w-4 h-4" />
                        <span>Filters & Sort</span>
                        {activeFiltersCount > 0 && (
                            <span className="ml-1 px-1.5 py-0.2 text-[11px] font-bold rounded-full bg-indigo-600 text-white">
                                {activeFiltersCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Reusable Expanded Filters Drawer & Active Filters Pills */}
            <SeriesFilterDrawer
                isOpen={showFilters}
                onClose={() => setShowFilters(false)}
                filters={filters}
                onFilterChange={handleFilterChange}
                sortConfig={sortConfig}
                onSortChange={(newKey) => setSortConfig(prev => ({ ...prev, key: newKey }))}
                onToggleSortDirection={toggleSortDirection}
                sortOptions={SORT_OPTIONS}
                onReset={resetFilters}
                activeFiltersCount={activeFiltersCount}
                onRemoveFilter={handleRemoveFilter}
            />

            {/* Results Count Info */}
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                <div>
                    Showing <span className="font-bold text-slate-800 dark:text-slate-200">{processedSeries.length}</span> of {allSeries.length} series
                </div>
                <div className="text-[11px] text-slate-400">
                    Sorted by: <span className="font-semibold text-slate-600 dark:text-slate-300">{SORT_OPTIONS.find(o => o.value === sortConfig.key)?.label}</span> ({sortConfig.direction.toUpperCase()})
                </div>
            </div>

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
                <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
                        <FiFilter className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
                        No series found matching your criteria
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 max-w-sm mx-auto">
                        Try modifying your search keywords, clearing status filters, or resetting filter constraints.
                    </p>
                    <button 
                        onClick={resetFilters} 
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm cursor-pointer"
                    >
                        Reset All Filters
                    </button>
                </div>
            )}

            {/* Modals */}
            {isOwner && (
                <AddSeriesModal 
                    isOpen={isAddModalOpen} 
                    onClose={() => setIsAddModalOpen(false)} 
                    userId={userId} 
                />
            )}

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