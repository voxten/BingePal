"use client";

import { useRef, useMemo, useState, useEffect } from 'react';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '../firebase';
import {
    removeRecentWatched,
    clearAllRecentWatched,
    formatTimeAgo,
    getTVMazeEpisodes
} from '../services/recentWatchedService';
import {
    FiPlay,
    FiChevronLeft,
    FiChevronRight,
    FiTrash2,
    FiList,
    FiArrowDown,
    FiX,
    FiPlus
} from 'react-icons/fi';
import StreamingBadge from './ui/StreamingBadge';
import Badge from './ui/Badge';
import Button, { IconButton } from './ui/Button';
import SectionHeader from './ui/SectionHeader';
import ProgressBar from './ui/ProgressBar';
import MediaCard from './series/MediaCard';

const RecentlyWatched = ({ 
    userId, 
    isOwner, 
    allSeries = [], 
    onOpenTracker, 
    onJumpToSeries,
    onWatchedEpisodesChange
}) => {
    const scrollContainerRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const [historyItems, setHistoryItems] = useState([]);
    const [tvmazeMeta, setTvmazeMeta] = useState({});
    const [updatingKey, setUpdatingKey] = useState(null);

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
                    watchedEpisodesList: [],
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
                    runtime: item.runtime || null,
                    airdate: item.airdate || null,
                    seasonEpisodesCount: item.seasonEpisodesCount ? Number(item.seasonEpisodesCount) : null,
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
                        runtime: null,
                        airdate: null,
                        seasonEpisodesCount: null,
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

    // Asynchronously fetch and enrich TVMaze episode data (cached) for high-res stills and season metrics
    useEffect(() => {
        const tvmazeIds = [...new Set(recentItems.map(i => i.tvmazeId).filter(Boolean))];
        if (tvmazeIds.length === 0) return;

        let isMounted = true;
        Promise.all(tvmazeIds.map(async (id) => {
            const episodes = await getTVMazeEpisodes(id);
            return { id: String(id), episodes };
        })).then((results) => {
            if (!isMounted) return;
            const metaMap = {};
            results.forEach(({ id, episodes }) => {
                if (episodes) metaMap[id] = episodes;
            });
            setTvmazeMeta(prev => ({ ...prev, ...metaMap }));
        });

        return () => { isMounted = false; };
    }, [recentItems]);


    const checkScrollBounds = () => {
        if (!scrollContainerRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
        setCanScrollLeft(scrollLeft > 10);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    };

    const handleScroll = (direction) => {
        if (!scrollContainerRef.current) return;
        const scrollAmount = 340;
        scrollContainerRef.current.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth'
        });
        setTimeout(checkScrollBounds, 350);
    };

    const handleQuickNext = async (item, nextEpisodeNumber) => {
        if (!isOwner || !onWatchedEpisodesChange) return;
        setUpdatingKey(item.id);
        try {
            await onWatchedEpisodesChange(item.userSeriesId, nextEpisodeNumber, item.seriesDoc);
        } finally {
            setTimeout(() => setUpdatingKey(null), 500);
        }
    };

    // Initialize arrow state once the shelf has content
    useEffect(() => {
        checkScrollBounds();
    }, [recentItems.length]);

    if (recentItems.length === 0) {
        return null;
    }

    return (
        <section className="mb-10" aria-label="Recently watched episodes">
            <SectionHeader
                title="Recently watched"
                description="Pick up where you left off"
                className="mb-4"
                actions={
                    <>
                        {isOwner && (
                            <Button
                                variant="ghost"
                                size="sm"
                                icon={FiTrash2}
                                onClick={() => {
                                    if (window.confirm('Clear all recently watched history?')) {
                                        clearAllRecentWatched(userId);
                                    }
                                }}
                                title="Clear watch history"
                            >
                                <span className="hidden sm:inline">Clear</span>
                            </Button>
                        )}
                        <IconButton
                            icon={FiChevronLeft}
                            label="Scroll left"
                            variant="secondary"
                            size="sm"
                            disabled={!canScrollLeft}
                            onClick={() => handleScroll('left')}
                        />
                        <IconButton
                            icon={FiChevronRight}
                            label="Scroll right"
                            variant="secondary"
                            size="sm"
                            disabled={!canScrollRight}
                            onClick={() => handleScroll('right')}
                        />
                    </>
                }
            />

            {/* Horizontal carousel */}
            <div
                ref={scrollContainerRef}
                onScroll={checkScrollBounds}
                className="no-scrollbar flex items-stretch gap-4 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory"
            >
                {recentItems.map((item) => {
                    const seriesData = item.seriesDoc;
                    const tvmazeEpisodes = item.tvmazeId ? tvmazeMeta[String(item.tvmazeId)] : null;
                    const matchedEp = tvmazeEpisodes
                        ? (tvmazeEpisodes.find(e => e.trackerId === item.episodeNumber) || tvmazeEpisodes[item.episodeNumber - 1])
                        : null;

                    const seasonNum = matchedEp?.season ?? item.seasonNumber ?? 1;
                    const epInSeason = matchedEp?.number ?? item.episodeInSeason ?? item.episodeNumber ?? 1;
                    const epTitle = matchedEp?.name || item.episodeTitle || `Episode ${item.episodeNumber}`;
                    const epImage = matchedEp?.image?.original || matchedEp?.image?.medium || item.imageUrl || seriesData.imageUrl;
                    const runtime = matchedEp?.runtime || item.runtime;

                    // Episode's season progress computation
                    const seasonEpisodes = tvmazeEpisodes ? tvmazeEpisodes.filter(e => e.season === seasonNum) : null;
                    const seasonTotal = seasonEpisodes?.length || item.seasonEpisodesCount || null;

                    let progressLabel = '';
                    let progressPercent = 100;

                    if (seasonTotal && seasonTotal > 0) {
                        progressPercent = Math.min(100, Math.max(0, Math.round((epInSeason / seasonTotal) * 100)));
                        progressLabel = `Season ${seasonNum} · ${epInSeason} of ${seasonTotal}`;
                    } else if (item.totalEpisodes && item.totalEpisodes > 0) {
                        progressPercent = Math.min(100, Math.max(0, Math.round((item.episodeNumber / item.totalEpisodes) * 100)));
                        progressLabel = `Episode ${item.episodeNumber} of ${item.totalEpisodes}`;
                    } else {
                        progressPercent = 100;
                        progressLabel = `Episode ${item.episodeNumber}`;
                    }

                    // Next episode computation
                    const nextEpisodeNumber = item.episodeNumber + 1;
                    const totalSeriesEps = seriesData.totalEpisodes || item.totalEpisodes || 0;
                    const hasNextEpisode = totalSeriesEps > 0
                        ? item.episodeNumber < totalSeriesEps
                        : (tvmazeEpisodes ? nextEpisodeNumber <= tvmazeEpisodes.length : false);

                    const nextEp = tvmazeEpisodes ? tvmazeEpisodes.find(e => e.trackerId === nextEpisodeNumber) : null;
                    const nextTag = nextEp && nextEp.season && nextEp.number
                        ? `S${nextEp.season}E${nextEp.number}`
                        : `Ep. ${nextEpisodeNumber}`;

                    const episodeTag = `S${String(seasonNum).padStart(2, '0')}E${String(epInSeason).padStart(2, '0')}`;
                    const currentSeriesWatched = seriesData.watchedEpisodes || item.episodeNumber || 0;
                    const isUpdating = updatingKey === item.id;
                    const showNext = isOwner && hasNextEpisode;
                    const openTracker = () => onOpenTracker && onOpenTracker({ ...seriesData, initialSeason: seasonNum });
                    const jumpToSeries = () => onJumpToSeries && onJumpToSeries(item.userSeriesId || item.seriesId);

                    return (
                        <MediaCard
                            key={item.id}
                            className="snap-start shrink-0 w-[300px] sm:w-[340px]"
                            aspect="video"
                            imageUrl={epImage}
                            fallbackImageUrl={seriesData.imageUrl}
                            title={item.seriesTitle}
                            onTitleClick={jumpToSeries}
                            onPosterClick={openTracker}
                            posterLabel="Open episode tracker"
                            meta={
                                <>
                                    <span className="truncate">{epTitle}</span>
                                    {runtime && <span className="shrink-0 tabular-nums">· {runtime}m</span>}
                                </>
                            }
                            topLeft={
                                <>
                                    <Badge variant="overlay">{episodeTag}</Badge>
                                    <StreamingBadge showData={seriesData} />
                                </>
                            }
                            topRight={isOwner && (
                                <IconButton
                                    icon={FiX}
                                    label="Remove from history"
                                    variant="overlay"
                                    size="xs"
                                    onClick={() => removeRecentWatched(userId, item.itemKey || item.id)}
                                />
                            )}
                            posterOverlay={
                                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                    <span className="w-10 h-10 rounded-full bg-black/55 backdrop-blur-md ring-1 ring-white/20 text-white flex items-center justify-center opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition duration-200">
                                        <FiPlay className="w-4 h-4 ml-0.5 fill-current" />
                                    </span>
                                </div>
                            }
                        >
                            <div className="space-y-1.5">
                                <ProgressBar percent={progressPercent} label={progressLabel} />
                                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                                    <span>{formatTimeAgo(item.watchedAt)}</span>
                                    {totalSeriesEps > 0 && (
                                        <span>Series {currentSeriesWatched}/{totalSeriesEps}</span>
                                    )}
                                </div>
                            </div>

                            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                                {showNext && (
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        icon={FiPlus}
                                        loading={isUpdating}
                                        onClick={() => handleQuickNext(item, nextEpisodeNumber)}
                                        title={`Mark next episode (${nextTag}) as watched`}
                                        className="flex-1"
                                    >
                                        Next · {nextTag}
                                    </Button>
                                )}

                                <Button
                                    variant="secondary"
                                    size="sm"
                                    icon={FiList}
                                    onClick={openTracker}
                                    title={`Open tracker on season ${seasonNum}`}
                                    className={showNext ? '' : 'flex-1'}
                                >
                                    Episodes
                                </Button>

                                <IconButton
                                    icon={FiArrowDown}
                                    label="Show in collection"
                                    size="sm"
                                    onClick={jumpToSeries}
                                />
                            </div>
                        </MediaCard>
                    );
                })}
            </div>
        </section>
    );
};

export default RecentlyWatched;
