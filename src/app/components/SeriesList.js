"use client";

import { useState, useMemo } from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, where, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import AddSeriesModal from './AddSeriesModal';
import EditSeriesModal from './EditSeriesModal';
import EpisodesModal from './EpisodesModal';
import { 
    FiPlus, 
    FiEdit2, 
    FiTrash2, 
    FiFilter, 
    FiX, 
    FiStar, 
    FiSearch, 
    FiShare2, 
    FiCheck, 
    FiList, 
    FiRefreshCw, 
    FiAlertCircle, 
    FiArrowUp, 
    FiArrowDown,
    FiSliders,
    FiRotateCcw,
    FiPlay,
    FiCheckCircle,
    FiClock,
    FiPauseCircle,
    FiXCircle,
    FiTv,
    FiGrid,
    FiSquare,
    FiChevronDown
} from 'react-icons/fi';
import LoadingSpinner from './LoadingSpinner';
import { useAuth } from '../context/AuthContext';

const SORT_OPTIONS = [
    { value: 'title', label: 'Title (Alphabetical)' },
    { value: 'rating', label: 'Rating' },
    { value: 'progress', label: 'Progress (%)' },
    { value: 'watchedEpisodes', label: 'Watched Episodes' },
    { value: 'totalEpisodes', label: 'Total Episodes' },
    { value: 'seasons', label: 'Seasons Count' },
];

const STATUS_CONFIG = {
    'watching': {
        label: 'Watching',
        icon: FiPlay,
        pillBg: 'bg-blue-500/20 dark:bg-blue-500/30 text-blue-300 border-blue-400/30',
        dot: 'bg-blue-400 animate-pulse',
    },
    'completed': {
        label: 'Completed',
        icon: FiCheckCircle,
        pillBg: 'bg-emerald-500/20 dark:bg-emerald-500/30 text-emerald-300 border-emerald-400/30',
        dot: 'bg-emerald-400',
    },
    'plan-to-watch': {
        label: 'Plan to Watch',
        icon: FiClock,
        pillBg: 'bg-indigo-500/20 dark:bg-indigo-500/30 text-indigo-300 border-indigo-400/30',
        dot: 'bg-indigo-400',
    },
    'on-hold': {
        label: 'On Hold',
        icon: FiPauseCircle,
        pillBg: 'bg-amber-500/20 dark:bg-amber-500/30 text-amber-300 border-amber-400/30',
        dot: 'bg-amber-400',
    },
    'dropped': {
        label: 'Dropped',
        icon: FiXCircle,
        pillBg: 'bg-rose-500/20 dark:bg-rose-500/30 text-rose-300 border-rose-400/30',
        dot: 'bg-rose-400',
    },
};

const SeriesList = ({ userId }) => {
    const { user } = useAuth();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingSeries, setEditingSeries] = useState(null);
    const [trackingSeries, setTrackingSeries] = useState(null);
    const [copied, setCopied] = useState(false);
    
    // View mode: 'vertical' (2:3 poster) or 'wide' (16:10 card)
    const [cardLayout, setCardLayout] = useState('vertical');
    
    // Tracks which card's status picker menu is open
    const [openStatusMenuId, setOpenStatusMenuId] = useState(null);

    // Filter & Sort state
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

    const [sortConfig, setSortConfig] = useState({
        key: 'title',
        direction: 'asc'
    });

    const [showFilters, setShowFilters] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncStatus, setSyncStatus] = useState('');

    const isOwner = user?.uid === userId;

    const q = query(collection(db, 'series'), where('userId', '==', userId));
    const [series, loading, error] = useCollection(q);

    const isEmptyCollection = !loading && (!series || series.docs.length === 0);
    const seriesNeedingSync = series?.docs.filter(doc => !doc.data().tvmazeId) || [];

    const handleAutoSync = async () => {
        setIsSyncing(true);
        for (let i = 0; i < seriesNeedingSync.length; i++) {
            const docSnap = seriesNeedingSync[i];
            const data = docSnap.data();
            setSyncStatus(`Syncing (${i + 1}/${seriesNeedingSync.length}): ${data.title}`);

            try {
                const searchRes = await fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(data.title)}`);
                const searchData = await searchRes.json();

                if (searchData && searchData.length > 0) {
                    const show = searchData[0].show;
                    const tvmazeId = show.id;
                    const imdbId = show.externals?.imdb || '';

                    const epRes = await fetch(`https://api.tvmaze.com/shows/${tvmazeId}/episodes`);
                    const episodes = await epRes.json();
                    
                    let watchedCount = data.watchedEpisodes || 0;
                    if (watchedCount > episodes.length) watchedCount = episodes.length;
                    
                    const newWatchedList = Array.from({ length: watchedCount }, (_, index) => index + 1);

                    await updateDoc(doc(db, 'series', docSnap.id), {
                        tvmazeId: tvmazeId.toString(),
                        imdbId: imdbId || data.imdbId || '',
                        totalEpisodes: episodes.length,
                        watchedEpisodesList: newWatchedList,
                        watchedEpisodes: watchedCount
                    });
                }
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (err) {
                console.error(`Error auto-syncing ${data.title}:`, err);
            }
        }

        setSyncStatus('Sync complete!');
        setTimeout(() => {
            setIsSyncing(false);
            setSyncStatus('');
        }, 2000);
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
        if (!series?.docs) return [];

        return series.docs
            .filter(docSnap => {
                const data = docSnap.data();
                const currentRating = data.rating || 0;
                const watched = data.watchedEpisodes || 0;
                const total = data.totalEpisodes || 0;
                const progress = total > 0 ? Math.round((watched / total) * 100) : 0;

                if (filters.searchQuery.trim() && !data.title?.toLowerCase().includes(filters.searchQuery.toLowerCase().trim())) {
                    return false;
                }
                if (filters.status && data.status !== filters.status) {
                    return false;
                }
                if (filters.progressStatus === 'not-started' && watched > 0) return false;
                if (filters.progressStatus === 'in-progress' && (progress === 0 || progress >= 100)) return false;
                if (filters.progressStatus === 'completed' && progress < 100) return false;

                if (filters.seasonsMin !== '' && (data.seasons || 0) < parseInt(filters.seasonsMin)) return false;
                if (filters.seasonsMax !== '' && (data.seasons || 0) > parseInt(filters.seasonsMax)) return false;

                if (filters.episodesMin !== '' && watched < parseInt(filters.episodesMin)) return false;
                if (filters.episodesMax !== '' && watched > parseInt(filters.episodesMax)) return false;

                if (filters.ratingMin !== '' && currentRating < parseInt(filters.ratingMin)) return false;
                if (filters.ratingMax !== '' && currentRating > parseInt(filters.ratingMax)) return false;

                return true;
            })
            .sort((aDoc, bDoc) => {
                const a = aDoc.data();
                const b = bDoc.data();
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
    }, [series, filters, sortConfig]);

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

    const handleDelete = async (id) => {
        if (!isOwner) return;
        if (window.confirm('Are you sure you want to delete this series?')) {
            await deleteDoc(doc(db, 'series', id));
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        if (!isOwner) return;
        await updateDoc(doc(db, 'series', id), { status: newStatus });
    };

    const handleWatchedEpisodesChange = async (seriesId, newCount, seriesData) => {
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

        await updateDoc(doc(db, 'series', seriesId), { 
            watchedEpisodes: count,
            watchedEpisodesList: newList,
            status: count === seriesData.totalEpisodes && seriesData.totalEpisodes > 0 ? 'completed' : seriesData.status
        });
    };

    const handleRatingChange = async (id, newRating) => {
        if (!isOwner) return;
        await updateDoc(doc(db, 'series', id), { rating: newRating });
    };

    const getProgressColor = (progress) => {
        if (progress <= 25) return { bar: 'from-rose-500 to-amber-500', text: 'text-rose-500 dark:text-rose-400' };
        if (progress <= 60) return { bar: 'from-amber-500 to-yellow-500', text: 'text-amber-500 dark:text-amber-400' };
        if (progress <= 99) return { bar: 'from-blue-500 to-indigo-500', text: 'text-indigo-500 dark:text-indigo-400' };
        return { bar: 'from-emerald-500 to-teal-400', text: 'text-emerald-500 dark:text-emerald-400' };
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
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
                            <button onClick={() => setIsAddModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-medium px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-500/20 text-sm w-full sm:w-auto">
                                Add your first series
                            </button>
                            <AddSeriesModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} userId={userId} />
                        </>
                    )}
                    <button onClick={handleCopyLink} className={`flex items-center justify-center gap-2 font-medium px-6 py-2.5 rounded-xl transition-all border text-sm w-full sm:w-auto ${copied ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : 'bg-white border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                        {copied ? <FiCheck className="w-4 h-4" /> : <FiShare2 className="w-4 h-4" />}
                        <span>{copied ? 'Link Copied!' : 'Copy Collection Link'}</span>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            {isOwner && seriesNeedingSync.length > 0 && (
                <div className="mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 dark:bg-indigo-950/20 dark:border-indigo-900/40">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg text-indigo-600 dark:text-indigo-400 shrink-0">
                            <FiAlertCircle className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="font-bold text-indigo-900 dark:text-indigo-200 text-sm">Action Required: Missing IDs</h4>
                            <p className="text-xs text-indigo-700/80 dark:text-indigo-300/80 mt-0.5">
                                You have <b>{seriesNeedingSync.length}</b> series missing TVMaze/IMDb IDs required for the new Episode Tracker.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleAutoSync}
                        disabled={isSyncing}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm shrink-0"
                    >
                        <FiRefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                        <span>{isSyncing ? syncStatus : 'Auto-Fix All Missing'}</span>
                    </button>
                </div>
            )}

            {/* Top Control Bar */}
            <div className="mb-6">
                <div className="flex flex-col lg:flex-row gap-3 justify-between items-stretch lg:items-center">
                    
                    {/* Search Field */}
                    <div className="relative flex-grow lg:max-w-md group">
                        <input
                            type="text"
                            name="searchQuery"
                            value={filters.searchQuery}
                            onChange={handleFilterChange}
                            placeholder={isOwner ? "Search by title..." : "Search this collection..."}
                            className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl transition-all focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 shadow-sm text-sm dark:text-slate-100 placeholder:text-slate-400"
                        />
                        <FiSearch className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        {filters.searchQuery && (
                            <button 
                                onClick={() => setFilters(prev => ({ ...prev, searchQuery: '' }))}
                                className="absolute right-3 top-3 p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
                            >
                                <FiX className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Action Controls & Layout Switcher */}
                    <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center justify-end">
                        
                        {/* Layout Switcher */}
                        <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-sm h-[42px] w-full sm:w-auto">
                            <button
                                type="button"
                                onClick={() => setCardLayout('vertical')}
                                className={`flex-1 sm:flex-initial h-full px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                                    cardLayout === 'vertical'
                                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 font-bold border border-indigo-200/60 dark:border-indigo-800/60 shadow-xs'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                                }`}
                                title="Poster View (2:3)"
                            >
                                <FiSquare className="w-3.5 h-3.5" />
                                <span>Poster</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setCardLayout('wide')}
                                className={`flex-1 sm:flex-initial h-full px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                                    cardLayout === 'wide'
                                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 font-bold border border-indigo-200/60 dark:border-indigo-800/60 shadow-xs'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                                }`}
                                title="Wide View (Landscape)"
                            >
                                <FiGrid className="w-3.5 h-3.5" />
                                <span>Wide</span>
                            </button>
                        </div>

                        <button 
                            onClick={handleCopyLink} 
                            className={`flex items-center justify-center gap-2 font-medium px-4 h-[42px] rounded-xl transition-all border text-sm w-full sm:w-auto ${
                                copied 
                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-sm' 
                                    : 'bg-white border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-sm'
                            }`}
                        >
                            {copied ? <FiCheck className="w-4 h-4 text-emerald-500" /> : <FiShare2 className="w-4 h-4" />}
                            <span>{copied ? 'Copied!' : 'Share'}</span>
                        </button>

                        <button 
                            onClick={() => setShowFilters(!showFilters)} 
                            className={`relative flex items-center justify-center gap-2 font-medium px-4 h-[42px] rounded-xl transition-all w-full sm:w-auto border text-sm shadow-sm ${
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

                        {isOwner && (
                            <button 
                                onClick={() => setIsAddModalOpen(true)} 
                                className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 h-[42px] rounded-xl transition-all active:scale-98 shadow-sm shadow-indigo-500/15 text-sm w-full sm:w-auto"
                            >
                                <FiPlus className="w-4 h-4" />
                                <span>Add Series</span>
                            </button>
                        )}


                    </div>
                </div>
            </div>

            {/* Expanded Filters Drawer */}
            {showFilters && (
                <div className="mb-6 p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-200/40 dark:shadow-none transition-all animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                            <FiFilter className="w-4 h-4 text-indigo-500" />
                            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Filter & Sort Options</h3>
                        </div>
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={resetFilters} 
                                className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
                            >
                                <FiRotateCcw className="w-3.5 h-3.5" />
                                <span>Reset All</span>
                            </button>
                            <button 
                                onClick={() => setShowFilters(false)} 
                                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                            >
                                <FiX className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                        <div className="space-y-1.5">
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                Sort By
                            </label>
                            <div className="flex items-center gap-2">
                                <select 
                                    value={sortConfig.key} 
                                    onChange={(e) => setSortConfig(prev => ({ ...prev, key: e.target.value }))}
                                    className="flex-grow px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold text-slate-700 dark:text-slate-200 h-[40px]"
                                >
                                    {SORT_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={toggleSortDirection}
                                    title={sortConfig.direction === 'asc' ? 'Ascending Order' : 'Descending Order'}
                                    className="h-[40px] px-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors shrink-0"
                                >
                                    {sortConfig.direction === 'asc' ? (
                                        <FiArrowUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                    ) : (
                                        <FiArrowDown className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                Status
                            </label>
                            <select 
                                name="status" 
                                value={filters.status} 
                                onChange={handleFilterChange} 
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold text-slate-700 dark:text-slate-200 h-[40px]"
                            >
                                <option value="">All Statuses</option>
                                <option value="plan-to-watch">Plan to Watch</option>
                                <option value="watching">Watching</option>
                                <option value="completed">Completed</option>
                                <option value="on-hold">On Hold</option>
                                <option value="dropped">Dropped</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                Progress
                            </label>
                            <select 
                                name="progressStatus" 
                                value={filters.progressStatus} 
                                onChange={handleFilterChange} 
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold text-slate-700 dark:text-slate-200 h-[40px]"
                            >
                                <option value="">Any Progress</option>
                                <option value="not-started">Not Started (0%)</option>
                                <option value="in-progress">In Progress (1-99%)</option>
                                <option value="completed">Finished (100%)</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                Seasons Range
                            </label>
                            <div className="flex items-center gap-1.5">
                                <input 
                                    type="number" 
                                    name="seasonsMin" 
                                    value={filters.seasonsMin} 
                                    onChange={handleFilterChange} 
                                    min="0" 
                                    placeholder="Min" 
                                    className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold h-[40px] text-slate-700 dark:text-slate-200" 
                                />
                                <span className="text-slate-400 font-medium text-xs">-</span>
                                <input 
                                    type="number" 
                                    name="seasonsMax" 
                                    value={filters.seasonsMax} 
                                    onChange={handleFilterChange} 
                                    min="0" 
                                    placeholder="Max" 
                                    className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold h-[40px] text-slate-700 dark:text-slate-200" 
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                Watched Eps Range
                            </label>
                            <div className="flex items-center gap-1.5">
                                <input 
                                    type="number" 
                                    name="episodesMin" 
                                    value={filters.episodesMin} 
                                    onChange={handleFilterChange} 
                                    min="0" 
                                    placeholder="Min" 
                                    className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold h-[40px] text-slate-700 dark:text-slate-200" 
                                />
                                <span className="text-slate-400 font-medium text-xs">-</span>
                                <input 
                                    type="number" 
                                    name="episodesMax" 
                                    value={filters.episodesMax} 
                                    onChange={handleFilterChange} 
                                    min="0" 
                                    placeholder="Max" 
                                    className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold h-[40px] text-slate-700 dark:text-slate-200" 
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5 sm:col-span-2 lg:col-span-3 xl:col-span-1">
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                Rating (Stars)
                            </label>
                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 h-[38px]">
                                    <span className="text-[10px] font-bold uppercase text-slate-400">Min</span>
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={`min-${star}`}
                                                type="button"
                                                onClick={() => setFilters(prev => ({
                                                    ...prev,
                                                    ratingMin: prev.ratingMin === star.toString() ? '' : star.toString()
                                                }))}
                                                className="focus:outline-none transition-transform active:scale-125 p-0.5"
                                            >
                                                <FiStar className={`w-3.5 h-3.5 ${star <= (filters.ratingMin ? parseInt(filters.ratingMin) : 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-600'}`} />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 h-[38px]">
                                    <span className="text-[10px] font-bold uppercase text-slate-400">Max</span>
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={`max-${star}`}
                                                type="button"
                                                onClick={() => setFilters(prev => ({
                                                    ...prev,
                                                    ratingMax: prev.ratingMax === star.toString() ? '' : star.toString()
                                                }))}
                                                className="focus:outline-none transition-transform active:scale-125 p-0.5"
                                            >
                                                <FiStar className={`w-3.5 h-3.5 ${star <= (filters.ratingMax ? parseInt(filters.ratingMax) : 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-600'}`} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* Active Filters Dismissible Pills Bar */}
            {activeFiltersCount > 0 && (
                <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className="text-xs font-semibold text-slate-400">Active filters:</span>
                    
                    {filters.status && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            Status: {STATUS_CONFIG[filters.status]?.label || filters.status}
                            <button onClick={() => setFilters(prev => ({ ...prev, status: '' }))} className="hover:text-indigo-900">
                                <FiX className="w-3 h-3" />
                            </button>
                        </span>
                    )}

                    {filters.progressStatus && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            Progress: {filters.progressStatus}
                            <button onClick={() => setFilters(prev => ({ ...prev, progressStatus: '' }))} className="hover:text-indigo-900">
                                <FiX className="w-3 h-3" />
                            </button>
                        </span>
                    )}

                    {(filters.seasonsMin || filters.seasonsMax) && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            Seasons: {filters.seasonsMin || '0'} - {filters.seasonsMax || '∞'}
                            <button onClick={() => setFilters(prev => ({ ...prev, seasonsMin: '', seasonsMax: '' }))} className="hover:text-indigo-900">
                                <FiX className="w-3 h-3" />
                            </button>
                        </span>
                    )}

                    {(filters.episodesMin || filters.episodesMax) && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            Eps: {filters.episodesMin || '0'} - {filters.episodesMax || '∞'}
                            <button onClick={() => setFilters(prev => ({ ...prev, episodesMin: '', episodesMax: '' }))} className="hover:text-indigo-900">
                                <FiX className="w-3 h-3" />
                            </button>
                        </span>
                    )}

                    {(filters.ratingMin || filters.ratingMax) && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            Rating: {filters.ratingMin ? `${filters.ratingMin}★` : '1★'} - {filters.ratingMax ? `${filters.ratingMax}★` : '5★'}
                            <button onClick={() => setFilters(prev => ({ ...prev, ratingMin: '', ratingMax: '' }))} className="hover:text-indigo-900">
                                <FiX className="w-3 h-3" />
                            </button>
                        </span>
                    )}

                    <button 
                        onClick={resetFilters} 
                        className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 ml-1 underline decoration-dotted"
                    >
                        Clear All
                    </button>
                </div>
            )}

            {/* Results Count Info */}
            <div className="mb-4 flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                <div>
                    Showing <span className="font-bold text-slate-800 dark:text-slate-200">{processedSeries.length}</span> of {series?.docs.length} series
                </div>
                <div className="text-[11px] text-slate-400">
                    Sorted by: <span className="font-semibold text-slate-600 dark:text-slate-300">{SORT_OPTIONS.find(o => o.value === sortConfig.key)?.label}</span> ({sortConfig.direction.toUpperCase()})
                </div>
            </div>

            {/* Series Cards Grid */}
            <div className={
                cardLayout === 'vertical'
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5"
                    : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5"
            }>
                {processedSeries.map((docData) => {
                    const data = docData.data();
                    const totalEps = data.totalEpisodes || 0;
                    const watchedEps = data.watchedEpisodes || 0;
                    const progress = totalEps > 0 ? Math.min(Math.round((watchedEps / totalEps) * 100), 100) : 0;
                    const progressColors = getProgressColor(progress);
                    
                    const statusMeta = STATUS_CONFIG[data.status] || {
                        label: data.status || 'Unknown',
                        icon: FiClock,
                        pillBg: 'bg-slate-500/20 text-slate-300 border-slate-400/30',
                        dot: 'bg-slate-400',
                    };
                    const StatusIcon = statusMeta.icon;

                    return (
                        <div 
                            key={docData.id} 
                            className="group relative flex flex-col bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-sm hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-700 transition-[box-shadow,border-color] duration-200"
                        >
                            {/* Card Poster Header */}
                            <div className={`relative overflow-hidden rounded-t-2xl bg-slate-950 ${
                                cardLayout === 'vertical' 
                                    ? 'aspect-[2/3]' 
                                    : 'aspect-[16/10] sm:aspect-[4/3]'
                            }`}>
                                <img
                                    src={data.imageUrl || 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Placeholder_view_vector.svg/1280px-Placeholder_view_vector.svg.png'}
                                    alt={data.title}
                                    className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105 opacity-90 group-hover:opacity-100"
                                    onError={(e) => { e.target.src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Placeholder_view_vector.svg/1280px-Placeholder_view_vector.svg.png'; }}
                                />

                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-black/20" />

                                {/* Floating Badges */}
                                <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                                    <div 
                                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full backdrop-blur-md border shadow-lg ${statusMeta.pillBg}`}
                                        title={`Status: ${statusMeta.label}`}
                                    >
                                        <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />
                                        <StatusIcon className="w-3.5 h-3.5 shrink-0" />
                                        <span className="text-[11px] font-bold tracking-wide">
                                            {statusMeta.label}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1 px-2 py-1 rounded-full backdrop-blur-md bg-black/60 border border-white/10 text-amber-400 text-[11px] font-bold shadow-lg">
                                        <FiStar className="w-3 h-3 fill-amber-400 text-amber-400" />
                                        <span>{data.rating ? Number(data.rating).toFixed(1) : '—'}</span>
                                    </div>
                                </div>

                                {/* Poster Bottom Details */}
                                <div className="absolute bottom-2.5 left-3 right-3 text-white">
                                    <h3 className="text-base font-bold tracking-tight leading-tight drop-shadow truncate mb-0.5">
                                        {data.title}
                                    </h3>
                                    <div className="flex items-center gap-2 text-[11px] text-slate-300 font-medium">
                                        <span className="flex items-center gap-1">
                                            <FiTv className="w-3 h-3 text-slate-400" />
                                            {data.seasons || 1} {data.seasons === 1 ? 'Season' : 'Seasons'}
                                        </span>
                                        <span>•</span>
                                        <span>{totalEps} Episodes</span>
                                    </div>
                                </div>
                            </div>

                            {/* Card Content & Tracking Area */}
                            <div className="p-3.5 flex flex-col flex-grow justify-between gap-3 bg-white dark:bg-slate-900 rounded-b-2xl">
                                
                                {/* Progress Bar & Episode Count */}
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center text-xs font-semibold">
                                        <span className="text-slate-600 dark:text-slate-400">
                                            <span className="text-slate-900 dark:text-slate-100 font-bold">{watchedEps}</span>
                                            <span className="text-slate-300 dark:text-slate-600 mx-1">/</span>
                                            {totalEps} eps
                                        </span>
                                        <span className={`font-bold transition-colors ${progressColors.text}`}>
                                            {progress}%
                                        </span>
                                    </div>

                                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden shadow-inner">
                                        <div 
                                            className={`h-full rounded-full bg-gradient-to-r ${progressColors.bar} transition-all duration-500 ease-out`} 
                                            style={{ width: `${progress}%` }} 
                                        />
                                    </div>
                                </div>

                                {/* Episode Stepper & Interactive Status Menu */}
                                {isOwner ? (
                                    <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-2">
                                            {/* Compact Numeric Stepper */}
                                            <div className="shrink-0 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl p-1 shadow-sm h-[38px]">
                                                <button
                                                    type="button"
                                                    onClick={() => handleWatchedEpisodesChange(docData.id, watchedEps - 1, data)}
                                                    disabled={watchedEps <= 0}
                                                    className="w-6 h-6 flex items-center justify-center font-bold text-xs bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-xs"
                                                >
                                                    -
                                                </button>

                                                <div className="flex items-center justify-center px-1">
                                                    <input
                                                        type="number"
                                                        value={watchedEps}
                                                        onChange={(e) => handleWatchedEpisodesChange(docData.id, e.target.value, data)}
                                                        min="0"
                                                        max={totalEps}
                                                        className="w-8 text-center bg-transparent text-slate-800 dark:text-white font-bold text-xs focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                    />
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => handleWatchedEpisodesChange(docData.id, watchedEps + 1, data)}
                                                    disabled={watchedEps >= totalEps}
                                                    className="w-6 h-6 flex items-center justify-center font-bold text-xs bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-xs"
                                                >
                                                    +
                                                </button>
                                            </div>

                                            {/* Centered Custom Status Picker Dropdown */}
                                            <div className="relative flex-1 min-w-0">
                                                <button
                                                    type="button"
                                                    onClick={() => setOpenStatusMenuId(openStatusMenuId === docData.id ? null : docData.id)}
                                                    className="relative w-full h-[38px] px-6 flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all shadow-xs"
                                                >
                                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusMeta.dot}`} />
                                                    <span className="truncate whitespace-nowrap text-xs font-semibold tracking-tight">
                                                        {statusMeta.label}
                                                    </span>
                                                    <FiChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${openStatusMenuId === docData.id ? 'rotate-180 text-indigo-500' : ''}`} />
                                                </button>

                                                {/* Floating Status Options Menu */}
                                                {openStatusMenuId === docData.id && (
                                                    <>
                                                        <div 
                                                            className="fixed inset-0 z-40" 
                                                            onClick={() => setOpenStatusMenuId(null)} 
                                                        />
                                                        <div className="absolute right-0 bottom-[calc(100%+6px)] z-50 min-w-[155px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-150">
                                                            {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                                                                const OptionIcon = config.icon;
                                                                const isSelected = data.status === key;
                                                                return (
                                                                    <button
                                                                        key={key}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            handleStatusChange(docData.id, key);
                                                                            setOpenStatusMenuId(null);
                                                                        }}
                                                                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                                                                            isSelected 
                                                                                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 font-bold' 
                                                                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                                                                        }`}
                                                                    >
                                                                        <div className="flex items-center gap-2">
                                                                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`} />
                                                                            <OptionIcon className="w-3.5 h-3.5 shrink-0" />
                                                                            <span className="whitespace-nowrap">{config.label}</span>
                                                                        </div>
                                                                        {isSelected && <FiCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 ml-1.5" />}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                                        <div className="flex gap-0.5">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <FiStar 
                                                    key={star} 
                                                    className={`w-3.5 h-3.5 ${star <= (data.rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 dark:text-slate-700'}`} 
                                                />
                                            ))}
                                        </div>
                                        <span className="text-[11px] font-semibold text-slate-400">
                                            {data.rating || 0} / 5
                                        </span>
                                    </div>
                                )}

                                {/* Interactive Rating & Action Strip */}
                                {isOwner && (
                                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                        <div className="flex items-center gap-0.5">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button 
                                                    key={star} 
                                                    type="button"
                                                    onClick={() => handleRatingChange(docData.id, star)}
                                                    className="focus:outline-none transition-transform hover:scale-125 active:scale-140 p-0.5"
                                                    title={`Rate ${star} stars`}
                                                >
                                                    <FiStar 
                                                        className={`w-3.5 h-3.5 ${star <= (data.rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 dark:text-slate-700 hover:text-amber-300'}`} 
                                                    />
                                                </button>
                                            ))}
                                        </div>

                                        <div className="flex items-center gap-1">
                                            <button 
                                                onClick={() => setTrackingSeries({ id: docData.id, ...data })}
                                                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                                                title="Episode List Tracker"
                                            >
                                                <FiList className="w-4 h-4" />
                                            </button>

                                            <button 
                                                onClick={() => setEditingSeries({ id: docData.id, ...data })}
                                                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                                                title="Edit Series"
                                            >
                                                <FiEdit2 className="w-3.5 h-3.5" />
                                            </button>

                                            <button 
                                                onClick={() => handleDelete(docData.id)}
                                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                                title="Delete Series"
                                            >
                                                <FiTrash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Empty Search/Filter State */}
            {processedSeries.length === 0 && (
                <div className="text-center py-16 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-1">No matches discovered</h3>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mb-4">Try adjusting your active filters or search terms.</p>
                    <button 
                        onClick={resetFilters} 
                        className="text-xs font-bold uppercase tracking-wider px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-indigo-600 dark:text-indigo-400 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                        Clear All Filters
                    </button>
                </div>
            )}

            {isOwner && (
                <>
                    <AddSeriesModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} userId={userId} />
                    {editingSeries && <EditSeriesModal series={editingSeries} onClose={() => setEditingSeries(null)} />}
                    {trackingSeries && (
                        <EpisodesModal 
                            series={trackingSeries} 
                            onClose={() => setTrackingSeries(null)} 
                            isOwner={isOwner} 
                        />
                    )}
                </>
            )}
        </>
    );
};

export default SeriesList;