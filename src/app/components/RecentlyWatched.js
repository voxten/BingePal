"use client";

import { useRef, useMemo, useState, useEffect } from 'react';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { removeRecentWatched, clearAllRecentWatched, formatTimeAgo } from '../services/recentWatchedService';
import { 
    FiPlay, 
    FiClock, 
    FiChevronLeft, 
    FiChevronRight, 
    FiTrash2, 
    FiList, 
    FiArrowDown, 
    FiX, 
    FiCheckCircle
} from 'react-icons/fi';

const RecentlyWatched = ({ 
    userId, 
    isOwner, 
    allSeries = [], 
    onOpenTracker, 
    onJumpToSeries 
}) => {
    const scrollContainerRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const [historyItems, setHistoryItems] = useState([]);

    // Direct, real-time onSnapshot listener on the user's dedicated history document
    useEffect(() => {
        if (!userId) {
            setHistoryItems([]);
            return;
        }

        const historyDocRef = doc(db, 'userHistory', userId);
        const unsub = onSnapshot(historyDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (Array.isArray(data.items)) {
                    setHistoryItems(data.items);
                } else {
                    setHistoryItems([]);
                }
            } else {
                setHistoryItems([]);
            }
        }, (err) => {
            console.error('[RecentlyWatched] Error reading userHistory snapshot:', err);
        });

        return () => unsub();
    }, [userId]);

    // Derive recent items from dedicated userHistory document, with fallback to legacy series fields
    const recentItems = useMemo(() => {
        // 1. Primary: Dedicated userHistory document items array
        if (historyItems && historyItems.length > 0) {
            return historyItems.map(item => {
                const matchingSeries = allSeries.find(s => 
                    s.id === item.userSeriesId || s.userSeriesId === item.userSeriesId || s.seriesId === item.seriesId || s.id === item.seriesId
                );

                const finalSeriesDoc = matchingSeries || {
                    id: item.userSeriesId || item.seriesId,
                    userSeriesId: item.userSeriesId || item.seriesId,
                    seriesId: item.seriesId,
                    title: item.seriesTitle || 'Untitled Series',
                    imageUrl: item.imageUrl || '',
                    totalEpisodes: item.totalEpisodes || 0,
                    watchedEpisodes: item.watchedEpisodes || item.episodeNumber || 0,
                    tvmazeId: item.tvmazeId || ''
                };

                return {
                    id: item.id || `${item.seriesId}_${item.episodeNumber}`,
                    itemKey: item.id,
                    userSeriesId: item.userSeriesId || finalSeriesDoc.id,
                    seriesId: item.seriesId || finalSeriesDoc.seriesId,
                    seriesTitle: item.seriesTitle || finalSeriesDoc.title || 'Untitled Series',
                    imageUrl: item.imageUrl || finalSeriesDoc.imageUrl || '',
                    episodeNumber: Number(item.episodeNumber) || 1,
                    seasonNumber: item.seasonNumber ? Number(item.seasonNumber) : null,
                    episodeInSeason: item.episodeInSeason ? Number(item.episodeInSeason) : null,
                    episodeTitle: item.episodeTitle || `Episode ${item.episodeNumber}`,
                    totalEpisodes: Number(finalSeriesDoc.totalEpisodes) || Number(item.totalEpisodes) || 0,
                    watchedEpisodes: Number(finalSeriesDoc.watchedEpisodes) || Number(item.watchedEpisodes) || Number(item.episodeNumber) || 0,
                    watchedAt: item.watchedAt || 0,
                    tvmazeId: item.tvmazeId || finalSeriesDoc.tvmazeId,
                    seriesDoc: finalSeriesDoc
                };
            });
        }

        // 2. Fallback: Legacy series documents with lastWatchedAt
        if (allSeries && allSeries.length > 0) {
            return allSeries
                .map(item => {
                    const data = typeof item.data === 'function' ? item.data() : item;
                    const itemId = item.id || item.userSeriesId;
                    const watchedAt = data.lastWatchedAt || 0;
                    
                    return {
                        id: itemId,
                        itemKey: itemId,
                        userSeriesId: itemId,
                        seriesId: data.seriesId || itemId,
                        seriesTitle: data.title || 'Untitled Series',
                        imageUrl: data.lastWatchedImage || data.imageUrl,
                        episodeNumber: data.lastWatchedEpisode || data.watchedEpisodes || 0,
                        seasonNumber: data.lastWatchedSeason || null,
                        episodeInSeason: data.lastWatchedEpisodeInSeason || null,
                        episodeTitle: data.lastWatchedEpisodeTitle || (data.watchedEpisodes ? `Episode ${data.watchedEpisodes}` : ''),
                        totalEpisodes: data.totalEpisodes || 0,
                        watchedEpisodes: data.watchedEpisodes || 0,
                        watchedEpisodesList: data.watchedEpisodesList || [],
                        watchedAt: watchedAt,
                        tvmazeId: data.tvmazeId,
                        seriesDoc: { id: itemId, ...data }
                    };
                })
                .filter(item => item.watchedAt > 0)
                .sort((a, b) => b.watchedAt - a.watchedAt)
                .slice(0, 15);
        }

        return [];
    }, [historyItems, allSeries]);

    const checkScrollBounds = () => {
        if (!scrollContainerRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
        setCanScrollLeft(scrollLeft > 10);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    };

    const handleScroll = (direction) => {
        if (!scrollContainerRef.current) return;
        const scrollAmount = 320;
        scrollContainerRef.current.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth'
        });
        setTimeout(checkScrollBounds, 350);
    };

    if (recentItems.length === 0) {
        return null;
    }

    return (
        <section className="mb-8 relative" aria-label="Recently Watched Episodes">
            {/* Header / Title Bar */}
            <div className="flex items-center justify-between mb-3.5 px-1">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white">
                        <FiPlay className="w-3.5 h-3.5 ml-0.5 fill-current" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
                                Recently Watched
                            </h2>
                            <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
                                {recentItems.length}
                            </span>
                        </div>
                        <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                            Jump back in or track your latest episodes
                        </p>
                    </div>
                </div>

                {/* Carousel Controls & Actions */}
                <div className="flex items-center gap-1.5">
                    {isOwner && recentItems.length > 0 && (
                        <button
                            type="button"
                            onClick={() => {
                                if (window.confirm('Clear all recently watched history?')) {
                                    clearAllRecentWatched(userId);
                                }
                            }}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all text-xs font-semibold flex items-center gap-1 cursor-pointer"
                            title="Clear watch history"
                        >
                            <FiTrash2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline text-xs">Clear</span>
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => handleScroll('left')}
                        className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs active:scale-95 transition-all cursor-pointer"
                        aria-label="Scroll left"
                    >
                        <FiChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => handleScroll('right')}
                        className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs active:scale-95 transition-all cursor-pointer"
                        aria-label="Scroll right"
                    >
                        <FiChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Horizontal Scrollable Carousel */}
            <div
                ref={scrollContainerRef}
                onScroll={checkScrollBounds}
                className="flex items-stretch gap-3.5 overflow-x-auto pb-2 pt-1 scroll-smooth snap-x snap-mandatory scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 -mx-1 px-1"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {recentItems.map((item) => {
                    const seriesData = item.seriesDoc;
                    const currentWatched = seriesData.watchedEpisodes || item.episodeNumber || 0;
                    const totalEps = seriesData.totalEpisodes || item.totalEpisodes || 0;
                    const isCompleted = totalEps > 0 && currentWatched >= totalEps;
                    const progressPercent = totalEps > 0 ? Math.min(Math.round((currentWatched / totalEps) * 100), 100) : 0;

                    // Format season and episode tags
                    const episodeTag = item.seasonNumber && item.episodeInSeason
                        ? `S${String(item.seasonNumber).padStart(2, '0')}E${String(item.episodeInSeason).padStart(2, '0')}`
                        : `Ep. ${item.episodeNumber || currentWatched}`;

                    return (
                        <div
                            key={item.id}
                            className="group relative snap-start shrink-0 w-[290px] sm:w-[320px] bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-3.5 shadow-sm hover:shadow-xl hover:border-indigo-400/50 dark:hover:border-indigo-500/40 transition-all duration-200 flex flex-col justify-between"
                        >
                            {/* Card Content Top */}
                            <div>
                                <div className="flex gap-3 items-start">
                                    {/* Thumbnail Poster */}
                                    <div 
                                        onClick={() => onJumpToSeries && onJumpToSeries(item.userSeriesId || item.seriesId)}
                                        className="relative w-16 h-22 sm:w-18 sm:h-24 rounded-xl overflow-hidden bg-slate-950 shrink-0 cursor-pointer shadow-sm group-hover:shadow-md transition-shadow"
                                    >
                                        <img
                                            src={item.imageUrl || seriesData.imageUrl || 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Placeholder_view_vector.svg/1280px-Placeholder_view_vector.svg.png'}
                                            alt={item.seriesTitle}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            onError={(e) => {
                                                e.target.src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Placeholder_view_vector.svg/1280px-Placeholder_view_vector.svg.png';
                                            }}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent flex items-end justify-center p-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                                            <div className="w-6 h-6 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-md backdrop-blur-xs">
                                                <FiPlay className="w-2.5 h-2.5 ml-0.5 fill-current" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Series & Episode Meta */}
                                    <div className="flex-1 min-w-0 pr-5">
                                        <button
                                            type="button"
                                            onClick={() => onJumpToSeries && onJumpToSeries(item.userSeriesId || item.seriesId)}
                                            className="text-left font-bold text-sm text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 truncate block w-full transition-colors cursor-pointer"
                                            title={`Go to ${item.seriesTitle}`}
                                        >
                                            {item.seriesTitle}
                                        </button>

                                        {/* Episode Tag & Name */}
                                        <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-extrabold font-mono rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/70">
                                                {episodeTag}
                                            </span>
                                            {isCompleted && (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                                    <FiCheckCircle className="w-3 h-3" /> Done
                                                </span>
                                            )}
                                        </div>

                                        {/* Episode Name */}
                                        {item.episodeTitle && (
                                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1 font-medium" title={item.episodeTitle}>
                                                {item.episodeTitle}
                                            </p>
                                        )}

                                        {/* Time Ago */}
                                        <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                                            <FiClock className="w-3 h-3 shrink-0" />
                                            <span>{formatTimeAgo(item.watchedAt)}</span>
                                        </div>
                                    </div>

                                    {/* Dismiss / Remove Button */}
                                    {isOwner && (
                                        <button
                                            type="button"
                                            onClick={() => removeRecentWatched(userId, item.itemKey || item.id)}
                                            className="absolute top-2.5 right-2.5 p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                            title="Remove from recently watched"
                                        >
                                            <FiX className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>

                                {/* Mini Progress Bar */}
                                <div className="mt-3 space-y-1">
                                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 dark:text-slate-500">
                                        <span>Progress: {currentWatched} / {totalEps || '?'} eps</span>
                                        <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{progressPercent}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                        <div 
                                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300"
                                            style={{ width: `${progressPercent}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons Footer */}
                            <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2">
                                {/* Direct Jump to Series Card */}
                                <button
                                    type="button"
                                    onClick={() => onJumpToSeries && onJumpToSeries(item.userSeriesId || item.seriesId)}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-slate-50 hover:bg-indigo-50 dark:bg-slate-800/80 dark:hover:bg-indigo-950/50 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200/80 dark:border-slate-700/80 hover:border-indigo-300 dark:hover:border-indigo-800 rounded-xl text-xs font-semibold transition-all shadow-2xs active:scale-98 cursor-pointer"
                                    title="Scroll to series in collection"
                                >
                                    <FiArrowDown className="w-3.5 h-3.5" />
                                    <span>Show in List</span>
                                </button>

                                {/* Direct Open Episode Tracker */}
                                <button
                                    type="button"
                                    onClick={() => onOpenTracker && onOpenTracker(seriesData)}
                                    className="flex items-center justify-center gap-1.5 py-1.5 px-3 bg-slate-50 hover:bg-indigo-50 dark:bg-slate-800/80 dark:hover:bg-indigo-950/50 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200/80 dark:border-slate-700/80 hover:border-indigo-300 dark:hover:border-indigo-800 rounded-xl text-xs font-semibold transition-all shadow-2xs active:scale-98 cursor-pointer"
                                    title="Open episode details & season tracker"
                                >
                                    <FiList className="w-3.5 h-3.5" />
                                    <span>Episodes</span>
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

export default RecentlyWatched;
