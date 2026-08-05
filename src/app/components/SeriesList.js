"use client";

import { useState } from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, where, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import AddSeriesModal from './AddSeriesModal';
import EditSeriesModal from './EditSeriesModal';
import EpisodesModal from './EpisodesModal';
import { FiPlus, FiEdit2, FiTrash2, FiFilter, FiX, FiStar, FiSearch, FiShare2, FiCheck, FiList, FiRefreshCw, FiAlertCircle } from 'react-icons/fi';
import LoadingSpinner from './LoadingSpinner';
import { useAuth } from '../context/AuthContext';

const SeriesList = ({ userId }) => {
    const { user } = useAuth();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingSeries, setEditingSeries] = useState(null);
    const [trackingSeries, setTrackingSeries] = useState(null);
    const [copied, setCopied] = useState(false);
    
    // Stan filtrów z obsługą przedziałów
    const [filters, setFilters] = useState({
        searchQuery: '',
        status: '',
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

    const filteredSeries = series?.docs.filter(doc => {
        const data = doc.data();
        const currentRating = data.rating || 0;
        
        return (
            (filters.status === '' || data.status === filters.status) &&
            (filters.searchQuery === '' || data.title.toLowerCase().includes(filters.searchQuery.toLowerCase())) &&
            (filters.seasonsMin === '' || data.seasons >= parseInt(filters.seasonsMin)) &&
            (filters.seasonsMax === '' || data.seasons <= parseInt(filters.seasonsMax)) &&
            (filters.episodesMin === '' || data.watchedEpisodes >= parseInt(filters.episodesMin)) &&
            (filters.episodesMax === '' || data.watchedEpisodes <= parseInt(filters.episodesMax)) &&
            (filters.ratingMin === '' || currentRating >= parseInt(filters.ratingMin)) &&
            (filters.ratingMax === '' || currentRating <= parseInt(filters.ratingMax))
        );
    });

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

    const getStatusColor = (status) => {
        switch (status) {
            case 'watching': return 'bg-blue-500/10 text-blue-600 border border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-400';
            case 'completed': return 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400';
            case 'on-hold': return 'bg-amber-500/10 text-amber-600 border border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400';
            case 'dropped': return 'bg-rose-500/10 text-rose-600 border border-rose-500/20 dark:bg-rose-500/20 dark:text-rose-400';
            default: return 'bg-slate-500/10 text-slate-600 border border-slate-500/20 dark:bg-slate-500/20 dark:text-slate-400';
        }
    };

    const getProgressColor = (progress) => {
        if (progress <= 25) return { bar: 'from-rose-500 to-red-500', text: 'text-rose-600 dark:text-rose-400' };
        if (progress <= 60) return { bar: 'from-amber-500 to-yellow-500', text: 'text-amber-600 dark:text-amber-400' };
        if (progress <= 99) return { bar: 'from-violet-500 to-indigo-500', text: 'text-indigo-600 dark:text-indigo-400' };
        return { bar: 'from-emerald-500 to-green-500', text: 'text-emerald-600 dark:text-emerald-400' };
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'plan-to-watch': return 'Plan to Watch';
            case 'watching': return 'Watching';
            case 'completed': return 'Completed';
            case 'on-hold': return 'On Hold';
            case 'dropped': return 'Dropped';
            default: return status;
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const resetFilters = () => {
        setFilters({ 
            searchQuery: '', status: '', 
            seasonsMin: '', seasonsMax: '', 
            episodesMin: '', episodesMax: '', 
            ratingMin: '', ratingMax: '' 
        });
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

            <div className="mb-6 flex flex-col lg:flex-row gap-3 justify-between items-center">
                <div className="relative w-full lg:max-w-md group">
                    <input
                        type="text"
                        name="searchQuery"
                        value={filters.searchQuery}
                        onChange={handleFilterChange}
                        placeholder={isOwner ? "Search your collection..." : "Search this user's collection..."}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl transition-all focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 shadow-sm dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 dark:focus:ring-indigo-500/20"
                    />
                    <FiSearch className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>

                <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full lg:w-auto justify-end">
                    <button onClick={handleCopyLink} className={`flex items-center justify-center gap-2 font-medium px-4 py-2.5 rounded-xl transition-all border text-sm w-full sm:w-auto min-w-[130px] ${copied ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'bg-white border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                        {copied ? <FiCheck className="w-4 h-4 text-emerald-500" /> : <FiShare2 className="w-4 h-4" />}
                        <span>{copied ? 'Copied!' : 'Share Link'}</span>
                    </button>

                    {isOwner && (
                        <button onClick={() => setIsAddModalOpen(true)} className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2.5 rounded-xl transition-all active:scale-98 shadow-sm shadow-indigo-500/10 w-full sm:w-auto">
                            <FiPlus className="w-4 h-4" />
                            <span>Add Series</span>
                        </button>
                    )}

                    <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center justify-center gap-2 font-medium px-4 py-2.5 rounded-xl transition-all w-full sm:w-auto border ${showFilters ? 'bg-slate-200 border-slate-300 dark:bg-slate-700 dark:border-slate-600 text-slate-800 dark:text-white' : 'bg-white border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                        <FiFilter className="w-4 h-4" />
                        <span>Filters</span>
                    </button>
                </div>
            </div>

            {showFilters && (
                <div className="mb-6 p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-md transition-all animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                        <h3 className="font-semibold text-slate-800 dark:text-slate-200">Filter Collections</h3>
                        <div className="flex items-center gap-3">
                            <button onClick={resetFilters} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">
                                Reset All
                            </button>
                            <button onClick={() => setShowFilters(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                                <FiX className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">Status</label>
                            <select name="status" value={filters.status} onChange={handleFilterChange} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm h-[38px]">
                                <option value="">All Statuses</option>
                                <option value="plan-to-watch">Plan to Watch</option>
                                <option value="watching">Watching</option>
                                <option value="completed">Completed</option>
                                <option value="on-hold">On Hold</option>
                                <option value="dropped">Dropped</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">Seasons Range</label>
                            <div className="flex items-center gap-2">
                                <input type="number" name="seasonsMin" value={filters.seasonsMin} onChange={handleFilterChange} min="0" placeholder="Min" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm h-[38px]" />
                                <span className="text-slate-400 font-medium">-</span>
                                <input type="number" name="seasonsMax" value={filters.seasonsMax} onChange={handleFilterChange} min="0" placeholder="Max" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm h-[38px]" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">Watched Eps Range</label>
                            <div className="flex items-center gap-2">
                                <input type="number" name="episodesMin" value={filters.episodesMin} onChange={handleFilterChange} min="0" placeholder="Min" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm h-[38px]" />
                                <span className="text-slate-400 font-medium">-</span>
                                <input type="number" name="episodesMax" value={filters.episodesMax} onChange={handleFilterChange} min="0" placeholder="Max" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm h-[38px]" />
                            </div>
                        </div>

                        {/* Powrót do Gwiazdek */}
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">Rating (Stars)</label>
                            <div className="flex flex-col gap-1">
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
                                                className="focus:outline-none transition-transform active:scale-125"
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
                                                className="focus:outline-none transition-transform active:scale-125"
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

            {filteredSeries && filteredSeries.length !== series?.docs.length && (
                <div className="mb-4 text-xs font-medium inline-block bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md text-slate-600 dark:text-slate-400">
                    Showing <span className="font-bold text-slate-800 dark:text-slate-200">{filteredSeries.length}</span> of {series?.docs.length} series
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
                {filteredSeries?.map((docData) => {
                    const data = docData.data();
                    const progress = Math.min(Math.round((data.watchedEpisodes / data.totalEpisodes) * 100), 100) || 0;
                    const progressColors = getProgressColor(progress);

                    return (
                        <div key={docData.id} className="group flex flex-col bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden hover:shadow-xl hover:border-slate-300/50 dark:hover:border-slate-700/50 transition-all duration-300">

                            <div className="relative aspect-[2/3] overflow-hidden bg-slate-100 dark:bg-slate-950">
                                <img
                                    src={data.imageUrl || 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Placeholder_view_vector.svg/1280px-Placeholder_view_vector.svg.png'}
                                    alt={data.title}
                                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                    onError={(e) => { e.target.src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Placeholder_view_vector.svg/1280px-Placeholder_view_vector.svg.png'; }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-90"></div>

                                <div className="absolute top-2.5 right-2.5 backdrop-blur-md bg-white/90 dark:bg-slate-950/80 rounded-full px-2 py-0.5 shadow-sm">
                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${getStatusColor(data.status).split(' ')[1]}`}>
                                        {getStatusLabel(data.status)}
                                    </span>
                                </div>

                                <div className="absolute bottom-0 left-0 right-0 p-3.5">
                                    <h3 className="text-base font-bold text-white tracking-tight leading-snug drop-shadow-sm truncate mb-0.5">
                                        {data.title}
                                    </h3>
                                    <p className="text-[11px] font-medium text-slate-300/90">
                                        {data.seasons} {data.seasons === 1 ? 'Season' : 'Seasons'} • {data.totalEpisodes} Episodes
                                    </p>
                                </div>
                            </div>

                            <div className="p-4 flex flex-col flex-grow justify-between bg-white dark:bg-slate-900">
                                <div className="mb-3.5 flex items-center justify-between">
                                    <div className="flex gap-0.5">
                                        {[1, 2, 3, 4, 5].map((star) => {
                                            const isLit = star <= (data.rating || 0);
                                            const starGraphic = <FiStar className={`w-4 h-4 ${isLit ? 'text-amber-400 fill-amber-400' : 'text-slate-200 dark:text-slate-700'}`} />;
                                            return isOwner ? (
                                                <button key={star} onClick={() => handleRatingChange(docData.id, star)} className="focus:outline-none transition-transform active:scale-130">{starGraphic}</button>
                                            ) : (
                                                <div key={star} className="p-0.5">{starGraphic}</div>
                                            );
                                        })}
                                    </div>
                                    <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">{data.rating || 0} / 5</span>
                                </div>

                                <div className={isOwner ? "mb-4" : "mb-1"}>
                                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                                        <span className="text-slate-500 dark:text-slate-400">
                                            {data.watchedEpisodes} <span className="text-slate-300 dark:text-slate-700">/</span> {data.totalEpisodes} eps
                                        </span>
                                        <span className={`transition-colors duration-300 ${progressColors.text}`}>{progress}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                                        <div className={`h-full rounded-full bg-gradient-to-r ${progressColors.bar} transition-all duration-500 ease-out shadow-sm`} style={{ width: `${progress}%` }}></div>
                                    </div>
                                </div>

                                {isOwner && (
                                    <div className="space-y-2.5 mb-4">
                                        <div className="flex gap-2">
                                            <div className="flex-1 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl p-1">
                                                <button
                                                    onClick={() => handleWatchedEpisodesChange(docData.id, data.watchedEpisodes - 1, data)}
                                                    className="w-7 h-7 flex items-center justify-center font-bold bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-40"
                                                    disabled={data.watchedEpisodes <= 0}
                                                >
                                                    -
                                                </button>
                                                <input
                                                    type="number"
                                                    value={data.watchedEpisodes}
                                                    onChange={(e) => handleWatchedEpisodesChange(docData.id, e.target.value, data)}
                                                    min="0"
                                                    max={data.totalEpisodes}
                                                    className="w-12 text-center bg-transparent text-slate-800 dark:text-white font-bold text-sm focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                                <button
                                                    onClick={() => handleWatchedEpisodesChange(docData.id, data.watchedEpisodes + 1, data)}
                                                    className="w-7 h-7 flex items-center justify-center font-bold bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-40"
                                                    disabled={data.watchedEpisodes >= data.totalEpisodes}
                                                >
                                                    +
                                                </button>
                                            </div>
                                            
                                            <button 
                                                onClick={() => setTrackingSeries({ id: docData.id, ...data })}
                                                className="w-9 h-9 shrink-0 flex items-center justify-center bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20 rounded-xl transition-colors shadow-sm"
                                                title="Detailed Episodes Tracker"
                                            >
                                                <FiList className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <select
                                            value={data.status}
                                            onChange={(e) => handleStatusChange(docData.id, e.target.value)}
                                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 dark:text-slate-300"
                                        >
                                            <option value="plan-to-watch">Plan to Watch</option>
                                            <option value="watching">Watching</option>
                                            <option value="completed">Completed</option>
                                            <option value="on-hold">On Hold</option>
                                            <option value="dropped">Dropped</option>
                                        </select>
                                    </div>
                                )}

                                {isOwner && (
                                    <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex justify-between items-center">
                                        <button onClick={() => setEditingSeries({ id: docData.id, ...data })} className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 font-semibold transition-colors text-xs">
                                            <FiEdit2 className="w-3.5 h-3.5" />
                                            <span>Edit</span>
                                        </button>
                                        <button onClick={() => handleDelete(docData.id)} className="flex items-center gap-1.5 text-slate-400 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400 font-semibold transition-colors text-xs">
                                            <FiTrash2 className="w-3.5 h-3.5" />
                                            <span>Delete</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {filteredSeries?.length === 0 && (
                <div className="text-center py-16 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-1">No matches discovered</h3>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mb-4">Try twisting the filters or search term parameters.</p>
                    <button onClick={resetFilters} className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-indigo-600 dark:text-indigo-400 shadow-sm">
                        Clear Active Filters
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